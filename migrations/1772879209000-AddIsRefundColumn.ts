import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddIsRefundColumn1772879209000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'expenses',
            new TableColumn({
                name: 'is_refund',
                type: 'boolean',
                isNullable: false,
                default: false,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('expenses', 'is_refund');
    }
}
