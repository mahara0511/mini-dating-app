import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Unique,
  JoinColumn,
  Column,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('matches')
@Unique(['userAId', 'userBId'])
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userAId: string;

  @Column()
  userBId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userAId' })
  userA: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userBId' })
  userB: User;

  @Column({ nullable: true })
  scheduledDate: string;

  @Column({ nullable: true })
  scheduledTimeStart: string;

  @Column({ nullable: true })
  scheduledTimeEnd: string;

  @CreateDateColumn()
  createdAt: Date;
}
