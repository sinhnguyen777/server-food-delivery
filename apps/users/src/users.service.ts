import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtVerifyOptions } from '@nestjs/jwt';
import { ActivationDto, LoginDto, RegisterDto } from './dto/users.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { EmailService } from './email/email.service';

interface UserData {
  name: string;
  email: string;
  password: string;
  phone_number: number;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  // register users service
  async register(registerDto: RegisterDto, response: Response) {
    const { email, name, password, phone_number } = registerDto;

    const isEmailExit = await this.prisma.user.findUnique({
      where: { email },
    });

    if (isEmailExit) {
      throw new BadRequestException('User already exists with this email!');
    }

    // const phoneNumbersToCheck = [phone_number];

    const isPhoneNumberExit = await this.prisma.user.findFirst({
      where: { phone_number },
    });

    if (isPhoneNumberExit) {
      throw new BadRequestException(
        'User already exists with this phone number!',
      );
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const user = {
      email,
      name,
      password: hashPassword,
      phone_number,
    };

    const activationToken = await this.createActivationToken(user);

    const activationCode = activationToken.activationToken;

    const activation_token = activationToken.token;

    await this.emailService.sendMail({
      email: email,
      subject: 'Activate your account',
      template: './activation-mail',
      name: name,
      activationCode,
    });

    return { activation_token, response };
  }

  // create activation token
  async createActivationToken(user: UserData) {
    const activationToken = Math.floor(1000 + Math.random() * 9000).toString();

    const token = this.jwtService.sign(
      {
        user,
        activationToken,
      },
      {
        secret: this.configService.get<string>('ACTIVATION_TOKEN'),
        expiresIn: '5m',
      },
    );

    return { token, activationToken };
  }

  // activition user
  async activateUser(activationDto: ActivationDto, response: Response) {
    const { activationCode, activationToken } = activationDto;

    const newUser: { user: UserData; activitionCode: string } =
      this.jwtService.verify(activationToken, {
        secret: this.configService.get<string>('ACTIVATION_TOKEN'),
      } as JwtVerifyOptions) as { user: UserData; activitionCode: string };

    if (newUser.activitionCode !== activationCode) {
      throw new BadRequestException('Invalid activation code');
    }

    const { name, email, password, phone_number } = newUser.user;

    const existUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existUser) {
      throw new BadRequestException('User already exists with email');
    }

    const user = await this.prisma.user.create({
      data: { name, email, password, phone_number },
    });

    return { user, response };
  }

  // login users service
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = { email, password };
    return user;
  }

  // get all users service
  async getUsers() {
    return this.prisma.user.findMany({});
  }
}
