import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExpenseUserRelation1763240669000 implements MigrationInterface {
    name: string = 'AddExpenseUserRelation1763240669000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "expenses" ADD COLUMN "user_id" INT NOT NULL`);
        await queryRunner.query(
            `ALTER TABLE "expenses" ADD CONSTRAINT "FK_expenses_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id")`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "expenses" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "expenses" DROP CONSTRAINT "FK_expenses_user_id"`);
    }
}
