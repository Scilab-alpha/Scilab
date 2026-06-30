import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { BootstrapAdminUseCase } from '@/auth/application/use-cases/bootstrap-admin/bootstrap-admin.use-case';

@Injectable()
export class AuthAdminBootstrapService implements OnApplicationBootstrap {
  constructor(private readonly bootstrapAdminUseCase: BootstrapAdminUseCase) {}

  async onApplicationBootstrap() {
    await this.bootstrapAdminUseCase.execute();
  }
}
