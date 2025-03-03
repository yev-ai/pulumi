import { Output, interpolate } from '@pulumi/pulumi';
// TODO refactor out all the common things and break this down to be reasonable.

/**
 * Generates user data script for Amazon Linux 2 EC2 instances with VNC server setup.
 * The script performs the following operations:
 * - Updates system packages and installs EPEL repository
 * - Installs Firefox and X11/XFCE desktop environment components
 * - Sets up VNC server configuration with provided password
 * - Configures systemd service for VNC server
 * - Enables required system services
 * - Performs cleanup of temporary files and logs
 *
 * @param password - Output<string> containing the VNC server password
 * @returns Interpolated string containing the complete userdata script
 *
 * @example
 * ```typescript
 * const userData = getAl2UserData(pulumi.secret("myVncPassword"));
 * ```
 *
 * @remarks
 * - The VNC server will run on port 5901 (display :1)
 * - The script sets up XFCE4 as the desktop environment
 * - Desktop resolution is set to 1920x1080 with 24-bit color depth
 * - The VNC service runs under ec2-user account
 */
export const getAl2UserData = (password: Output<string>) => interpolate`#!/bin/bash
yum update -y
amazon-linux-extras install epel -y
amazon-linux-extras install firefox -y
yum install -y \
    xorg-x11-server-Xorg xorg-x11-xauth xorg-x11-apps xorg-x11-fonts-Type1 xorg-x11-fonts-100dpi xorg-x11-fonts-75dpi xorg-x11-utils \
    xfce4-session xfdesktop xfce4-panel xfce4-terminal xfwm4 xfce4-settings xfconf xfce-utils \
    polkit polkit-gnome tigervnc-server dbus-x11

if ! which startxfce4 >/dev/null 2>&1; then
    echo "startxfce4 not found, installing"
    yum install -y xfce4-session || {
        echo "Failed to install xfce4-session."
        exit 1
    }
else
    echo "startxfce4 already installed."
fi
rm -rf /var/cache/yum
rm -f /etc/xdg/autostart/xfce-polkit.desktop
rm -rf /tmp/*
rm -rf /var/tmp/*
find /var/log -type f | xargs -I{} truncate -s 0 {}
rm -f /etc/ssh/ssh_host_*
rm -rf /var/lib/cloud/instances/*
rm -rf /var/lib/cloud/data/*
rm -rf /var/lib/cloud/instance
rm -f /root/.bash_history
rm -f /home/ec2-user/.bash_history
 
mkdir -p /home/ec2-user/.vnc
echo "${password}" | vncpasswd -f > /home/ec2-user/.vnc/passwd
chmod 600 /home/ec2-user/.vnc/passwd
chown -R ec2-user:ec2-user /home/ec2-user/.vnc
rm -rf /home/ec2-user/.cache/sessions/*
rm -rf /home/ec2-user/.cache/thumbnails/*

cat > /home/ec2-user/.vnc/xstartup << 'EOL'
#!/bin/sh
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
export XKL_XMODMAP_DISABLE=1
exec dbus-launch --exit-with-session bash -c '
    startxfce4 &
    until [ -n "$DBUS_SESSION_BUS_ADDRESS" ] && dbus-send --session --dest=org.freedesktop.DBus \
       --type=method_call --print-reply / org.freedesktop.DBus.ListNames >/dev/null 2>&1; do
        echo "Waiting for DBus session to start..."
        sleep 0.5
    done
    /usr/libexec/polkit-gnome-authentication-agent-1 &
    wait
'
EOL

chmod +x /home/ec2-user/.vnc/xstartup
chown ec2-user:ec2-user /home/ec2-user/.vnc/xstartup

mkdir -p /home/ec2-user/.config/xfce4
cat > /home/ec2-user/.config/xfce4/helpers.rc << 'EOF'
WebBrowser=firefox
EOF
chown -R ec2-user:ec2-user /home/ec2-user/.config

cat > /etc/systemd/system/vncserver@.service << 'EOL'
[Unit]
Description=Remote desktop service (VNC)
After=network.target

[Service]
Type=forking
User=ec2-user
Group=ec2-user
WorkingDirectory=/home/ec2-user

PIDFile=/home/ec2-user/.vnc/%H:%i.pid
ExecStartPre=-/usr/bin/vncserver -kill :%i > /dev/null 2>&1
ExecStart=/usr/bin/vncserver :%i -geometry 1920x1080 -depth 24
ExecStop=/usr/bin/vncserver -kill :%i

[Install]
WantedBy=multi-user.target
EOL

systemctl daemon-reload
systemctl enable --now vncserver@1.service
systemctl enable --now amazon-ssm-agent
echo "ec2-user:${password}" | chpasswd`;

/**
 * Generates Ubuntu user data script for EC2 instance configuration with VNC server setup.
 * The script performs the following operations:
 * - Updates system packages
 * - Installs XFCE desktop environment and VNC server
 * - Manages Firefox installation (removes snap version, installs PPA version)
 * - Performs system cleanup to reduce disk space usage
 * - Configures VNC server with password protection
 * - Sets up XFCE desktop environment with Firefox as default browser
 * - Creates and enables VNC server systemd service
 *
 * @param password - Pulumi Output string containing the password for VNC and Ubuntu user
 * @returns A Pulumi interpolated string containing the complete user data script
 *
 * @example
 * ```typescript
 * const vncPassword = pulumi.secret("myPassword123");
 * const userData = getUbuntuUserData(vncPassword);
 * ```
 */
export const getUbuntuUserData = (password: Output<string>) => interpolate`#!/bin/bash
echo "Initial disk space:"
df -h /
apt-get update -y
apt-get install -y dbus-x11 xfce4 xfce4-goodies tightvncserver software-properties-common

snap remove firefox
apt-get purge -y firefox

add-apt-repository ppa:mozillateam/ppa -y

echo '
Package: firefox*
Pin: release o=LP-PPA-mozillateam
Pin-Priority: 1001
' | tee /etc/apt/preferences.d/mozilla-firefox

apt-get update -y
apt-get install -y firefox

echo "Post-install disk space:"
df -h /

apt-get clean
rm -rf /var/lib/apt/lists/*
apt-get autoremove -y
rm -rf /var/lib/snapd/cache/*
journalctl --vacuum-time=1s
cloud-init clean --logs
rm -rf /var/lib/cloud/instances/*
rm -rf /var/lib/cloud/data/*
rm -rf /tmp/*
rm -rf /var/tmp/*
find /var/log -type f -exec truncate -s 0 {} \;
rm -f /root/.bash_history
rm -f /home/ubuntu/.bash_history
rm -rf /home/ubuntu/.cache/sessions/*
rm -rf /home/ubuntu/.cache/thumbnails/*

echo "Post-cleanup disk space:"
df -h /

mkdir -p /home/ubuntu/.vnc
echo "${password}" | vncpasswd -f > /home/ubuntu/.vnc/passwd
chmod 600 /home/ubuntu/.vnc/passwd
chown -R ubuntu:ubuntu /home/ubuntu/.vnc
 
cat > /home/ubuntu/.vnc/xstartup << 'EOL'
#!/bin/bash
xrdb $HOME/.Xresources
startxfce4 &
EOL
chmod +x /home/ubuntu/.vnc/xstartup
chown ubuntu:ubuntu /home/ubuntu/.vnc/xstartup

mkdir -p /home/ubuntu/.config/xfce4
cat > /home/ubuntu/.config/xfce4/helpers.rc << 'EOF'
WebBrowser=firefox
EOF
chown -R ubuntu:ubuntu /home/ubuntu/.config

cat > /etc/systemd/system/vncserver@.service << 'EOL'
[Unit]
Description=Start TightVNC server at startup
After=syslog.target network.target

[Service]
Type=forking
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu

PIDFile=/home/ubuntu/.vnc/%H:%i.pid
ExecStartPre=-/usr/bin/vncserver -kill :%i > /dev/null 2>&1
ExecStart=/usr/bin/vncserver -depth 24 -geometry 1920x1080 :%i
ExecStop=/usr/bin/vncserver -kill :%i

[Install]
WantedBy=multi-user.target
EOL

systemctl daemon-reload
systemctl enable --now vncserver@1.service
echo "ubuntu:${password}" | chpasswd`;
