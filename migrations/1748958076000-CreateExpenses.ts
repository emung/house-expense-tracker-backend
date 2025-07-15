import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateExpenses1748958076000 implements MigrationInterface {
    name: string = 'CreateExpenses1748958076000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      CREATE TABLE "expenses"(
        id SERIAL PRIMARY KEY,
        amount NUMERIC NOT NULL,
        date_added TIMESTAMP NOT NULL DEFAULT now(),
        description VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL,
        recipient VARCHAR(255) NOT NULL,
        currency VARCHAR(255) NOT NULL)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "expenses";`);
    }
}
