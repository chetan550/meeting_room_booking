import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class InitialMigration1700000000000 implements MigrationInterface {
  name = 'InitialMigration1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasRooms = await queryRunner.hasTable('rooms');
    if (!hasRooms) {
      await queryRunner.createTable(
        new Table({
          name: 'rooms',
          columns: [
            {
              name: 'id',
              type: 'integer',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            {
              name: 'name',
              type: 'varchar',
              length: '100',
              isUnique: true,
            },
            {
              name: 'capacity',
              type: 'integer',
            },
            {
              name: 'floor',
              type: 'integer',
            },
            {
              name: 'amenities',
              type: 'text',
            },
          ],
        }),
        true
      );
    }

    const hasBookings = await queryRunner.hasTable('bookings');
    if (!hasBookings) {
      await queryRunner.createTable(
        new Table({
          name: 'bookings',
          columns: [
            {
              name: 'id',
              type: 'integer',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            {
              name: 'roomId',
              type: 'integer',
            },
            {
              name: 'title',
              type: 'varchar',
              length: '100',
            },
            {
              name: 'organizerEmail',
              type: 'varchar',
              length: '255',
            },
            {
              name: 'attendees',
              type: 'integer',
            },
            {
              name: 'start',
              type: 'varchar',
              length: '35',
            },
            {
              name: 'end',
              type: 'varchar',
              length: '35',
            },
            {
              name: 'status',
              type: 'varchar',
              length: '20',
              default: "'confirmed'",
            },
            {
              name: 'createdAt',
              type: 'varchar',
              length: '35',
            },
          ],
        }),
        true
      );

      await queryRunner.createIndex(
        'bookings',
        new TableIndex({
          name: 'IDX_BOOKING_ROOM_STATUS_START',
          columnNames: ['roomId', 'status', 'start'],
        })
      );

      await queryRunner.createIndex(
        'bookings',
        new TableIndex({
          name: 'IDX_BOOKING_ORGANIZER_DATE',
          columnNames: ['organizerEmail', 'status', 'start'],
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('bookings');
    await queryRunner.dropTable('rooms');
  }
}
