import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContractors1752558734478 implements MigrationInterface {
    name = 'CreateContractors1752558734478';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "contractors" (
                id SERIAL PRIMARY KEY, 
                name character varying(255) NOT NULL, 
                address character varying(255), 
                phone character varying(255) NOT NULL, 
                email character varying(255), 
                website character varying(255), 
                notes character varying(1000), 
                CONSTRAINT "name_contractor" UNIQUE ("name"),
                CONSTRAINT "phone_contractor" UNIQUE ("phone"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "contractors"`);
    }
}
