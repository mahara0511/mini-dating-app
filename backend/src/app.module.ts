import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { LikesModule } from './likes/likes.module';
import { MatchesModule } from './matches/matches.module';
import { AvailabilityModule } from './availability/availability.module';
import { dataSourceOptions } from './data-source';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      ...dataSourceOptions,
      autoLoadEntities: true,
      synchronize: false,
      migrationsRun: true,
    }),
    UsersModule,
    LikesModule,
    MatchesModule,
    AvailabilityModule,
  ],
})
export class AppModule {}
