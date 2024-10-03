import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'auth_codes' })
export class AuthCode {
  @PrimaryGeneratedColumn('uuid')
  code: string;

  @Column('text')
  payload: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
