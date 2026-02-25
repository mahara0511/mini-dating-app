import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1772008284659 implements MigrationInterface {
  name = 'InitialSchema1772008284659';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "age" integer NOT NULL,
        "gender" character varying(20) NOT NULL,
        "bio" text,
        "email" character varying NOT NULL,
        "avatarUrl" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // Create likes table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "likes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "fromUserId" uuid NOT NULL,
        "toUserId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_likes_fromUserId_toUserId" UNIQUE ("fromUserId", "toUserId"),
        CONSTRAINT "PK_likes" PRIMARY KEY ("id")
      )
    `);

    // Create matches table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "matches" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userAId" uuid NOT NULL,
        "userBId" uuid NOT NULL,
        "scheduledDate" character varying,
        "scheduledTimeStart" character varying,
        "scheduledTimeEnd" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_matches_userAId_userBId" UNIQUE ("userAId", "userBId"),
        CONSTRAINT "PK_matches" PRIMARY KEY ("id")
      )
    `);

    // Create availabilities table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "availabilities" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "matchId" uuid NOT NULL,
        "date" date NOT NULL,
        "startTime" character varying NOT NULL,
        "endTime" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_availabilities" PRIMARY KEY ("id")
      )
    `);

    // Create uuid-ossp extension if not exists
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Add foreign keys for likes
    await queryRunner.query(`
      ALTER TABLE "likes"
        ADD CONSTRAINT "FK_likes_fromUserId" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "likes"
        ADD CONSTRAINT "FK_likes_toUserId" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Add foreign keys for matches
    await queryRunner.query(`
      ALTER TABLE "matches"
        ADD CONSTRAINT "FK_matches_userAId" FOREIGN KEY ("userAId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "matches"
        ADD CONSTRAINT "FK_matches_userBId" FOREIGN KEY ("userBId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Add foreign keys for availabilities
    await queryRunner.query(`
      ALTER TABLE "availabilities"
        ADD CONSTRAINT "FK_availabilities_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "availabilities"
        ADD CONSTRAINT "FK_availabilities_matchId" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.query(`ALTER TABLE "availabilities" DROP CONSTRAINT IF EXISTS "FK_availabilities_matchId"`);
    await queryRunner.query(`ALTER TABLE "availabilities" DROP CONSTRAINT IF EXISTS "FK_availabilities_userId"`);
    await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT IF EXISTS "FK_matches_userBId"`);
    await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT IF EXISTS "FK_matches_userAId"`);
    await queryRunner.query(`ALTER TABLE "likes" DROP CONSTRAINT IF EXISTS "FK_likes_toUserId"`);
    await queryRunner.query(`ALTER TABLE "likes" DROP CONSTRAINT IF EXISTS "FK_likes_fromUserId"`);

    // Drop tables in reverse order (respecting dependencies)
    await queryRunner.query(`DROP TABLE IF EXISTS "availabilities"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "matches"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "likes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
