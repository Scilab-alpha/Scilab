export interface UnregisterPushDeviceInput {
  userId: string;
  token: unknown;
}

export interface UnregisterPushDeviceOutput {
  unregistered: boolean;
}
