import { BadGatewayException } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ActivationDto, RegisterDto } from './dto/users.dto';
import { ActivationResponse, RegisterResponse } from './types/users.type';
import { UsersService } from './users.service';
import { User } from './entities/users.entity';
import { Response } from 'express';

@Resolver('User')
export class UsersResolver {
  constructor(private readonly userService: UsersService) {}

  @Mutation(() => RegisterResponse)
  async register(
    @Args('registerDto') registerDto: RegisterDto,
    @Context() context: { res: Response },
  ): Promise<RegisterResponse> {
    if (!registerDto.email || !registerDto.password || !registerDto.name) {
      throw new BadGatewayException('Please fill the all fields');
    }

    const { activation_token } = await this.userService.register(
      registerDto,
      context.res,
    );

    return { activation_token };
  }

  @Mutation(() => ActivationResponse)
  async activateUser(
    @Args('activationDto') activationDto: ActivationDto,
    @Context() context: { res: Response },
  ): Promise<ActivationResponse> {
    return await this.userService.activateUser(activationDto, context.res);
  }

  @Query(() => [User])
  async getUsers() {
    this.userService.getUsers();
  }
}
