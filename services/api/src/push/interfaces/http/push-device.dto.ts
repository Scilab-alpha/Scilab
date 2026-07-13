export class RegisterPushDeviceDto {
  token!: string;
  platform?: string;
  clientDeviceId?: string;
}

export class UnregisterPushDeviceDto {
  token!: string;
}
