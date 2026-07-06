// exporter.js – exports all data from 10 tables to a structured JSON
import { state } from './state.js';

export const exporter = {
  /**
   * Exports all rows from the 10 core tables.
   * Returns a JSON object with a clear structure and insert order.
   */
  async exportAllData() {
    // Tables in the correct order for dependency (foreign keys)
    const tableOrder = [
      'tournaments', // no dependencies
      'stages', // no dependencies
      'cities', // no dependencies
      'stadiums', // depends on cities
      'groups', // depends on tournaments
      'teams', // depends on tournaments
      'matches', // depends on teams, groups, stages, stadiums, cities, tournaments
      'bracket_rules', // depends on stages, stadiums, cities, tournaments
      'match_scores', // depends on matches
      'match_events' // depends on matches and teams
    ];
    
    const tablesData = {};
    for (const table of tableOrder) {
      try {
        const rows = await state.db.jaferAll(`SELECT * FROM ${table}`);
        tablesData[table] = rows;
      } catch (err) {
        // If table doesn't exist or query fails, return empty array
        console.warn(`Failed to export table ${table}:`, err);
        tablesData[table] = [];
      }
    }
    
    return {
      schema: 'fifa2026',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      insertOrder: tableOrder,
      tables: tablesData
    };
  },
  
  /**
   * Downloads the export as a JSON file.
   */
  async downloadFullExport() {
    const data = await this.exportAllData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fifa_export_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};