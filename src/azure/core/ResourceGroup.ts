import { ResourceGroup } from '@pulumi/azure/core';

export const createResourceGroup = (resourcePrefix: string, location: string) =>
  new ResourceGroup(`${resourcePrefix}-rg`, {
    location,
  });
