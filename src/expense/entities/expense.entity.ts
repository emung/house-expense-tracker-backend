import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: 'decimal', precision: 10, scale: 2})
  amount: number;

  @Column({name: 'date_added'})
  date: Date;

  @Column({type: 'string', length: 255})
  description: string;

  @Column({type: 'string', length: 255})
  category: string;
}
