import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Like } from '../../likes/entities/like.entity';
import { Availability } from '../../availability/entities/availability.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column()
  age: number;

  @Column({ length: 20 })
  gender: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Like, (like) => like.fromUser)
  likesGiven: Like[];

  @OneToMany(() => Like, (like) => like.toUser)
  likesReceived: Like[];

  @OneToMany(() => Availability, (availability) => availability.user)
  availabilities: Availability[];
}
