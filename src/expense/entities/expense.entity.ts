import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { ColumnNumericTransformer } from '../../shared/transformer/column-numeric-transformer';
import { User } from '../../user/entities/user.entity';

export enum Currency {
  EUR = 'EUR',
  RON = 'RON',
}

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, transformer: new ColumnNumericTransformer() })
  amount: number;

  @Column({ name: 'date_added' })
  date: Date;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({ type: 'varchar', length: 255 })
  category: string;

  @Column({ type: 'varchar', length: 255 })
  recipient: string;

  @Column({ type: 'enum', enum: Currency })
  currency: Currency;

  @ManyToOne(() => User, (user) => user.expenses)
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: User;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;
}
