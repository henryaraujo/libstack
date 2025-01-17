import { DataTypes, Sequelize } from 'sequelize';
import path from 'path';
import { keyBy, sortBy } from 'lodash';
import { readdirSync, readFileSync } from 'fs';

/**
 * This is the migration options, you will need to define the absolute
 * path for the migration folder.
 */
export interface MigrationOptions {
  /**
   * Absolute path to the migration folder
   */
  dir: string;
}

export default class SequelizeMigration {
  private readonly sequelize: Sequelize;
  private readonly dialectName: string;
  private readonly modules: Array<MigrationOptions> = [];

  Migration: any;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
    this.dialectName = sequelize.getDialect();

    this.Migration = sequelize.define('Migration', {
      execution_id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      execution_ts: DataTypes.DATE,
      script_name: DataTypes.STRING,
      description: DataTypes.STRING,
      version: DataTypes.STRING,
      success: DataTypes.BOOLEAN
    }, {
      timestamps: false,
      paranoid: false,
      tableName: 'db_migration'
    });
  }

  /**
   * Creates a new Migration module
   */
  addModule(options: MigrationOptions) {
    this.modules.push(options);
  };

  /**
   * Syncs the database
   */
  async sync() {
    await this.Migration.sync({ force: false });
    for (const dbModule of this.modules) {
      await this.syncModule(dbModule);
    }
  };

  private async syncModule(moduleDescriptor: MigrationOptions) {
    const { dialectName } = this;
    const migrations = await this.Migration.findAll({
      order: [['script_name', 'ASC']]
    });

    const migrationsMap = migrations && keyBy(migrations, 'script_name') || {};
    const scripts = sortBy(readdirSync(path.join(moduleDescriptor.dir, dialectName)))
      .filter(scriptName => migrationsMap[scriptName] === undefined);

    for (let script of scripts) {
      const result = /V(\d{14,17})[_][_](.*)\.sql/g.exec(script);
      const description = result && result[2].replace(/[_]/g, ' ');
      const version = result && result[1];
      if (result) {
        const migration = await this.Migration.create({
          execution_ts: new Date(),
          script_name: script,
          description: description,
          version: version,
          success: false
        });
        const content = readFileSync(path.join(moduleDescriptor.dir, dialectName, script), 'utf8');
        await this.sequelize.query(content);

        migration.success = true;
        await migration.save({ fields: ['success'] });
      }
    }
  }
}

module.exports = SequelizeMigration;