import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'auth_codes' })
export class AuthCode {
  @PrimaryColumn()
  code: string;

  @Column('text')
  payload: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
