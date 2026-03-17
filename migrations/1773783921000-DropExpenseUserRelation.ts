import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropExpenseUserRelation1773783921000 implements MigrationInterface {
    name: string = 'DropExpenseUserRelation1773783921000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "expenses" DROP CONSTRAINT "FK_expenses_user_id"`);
        await queryRunner.query(`ALTER TABLE "expenses" DROP COLUMN "user_id"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "expenses" ADD COLUMN "user_id" INT`);
        await queryRunner.query(`UPDATE "expenses" SET "user_id" = 1 WHERE "user_id" IS NULL`);
        await queryRunner.query(`ALTER TABLE "expenses" ALTER COLUMN "user_id" SET NOT NULL`);
        await queryRunner.query(
            `ALTER TABLE "expenses" ADD CONSTRAINT "FK_expenses_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id")`,
        );
    }
}
