import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { zonesTable } from '../db/schema';
import { type CreateZoneInput } from '../schema';
import { getZones } from '../handlers/get_zones';

describe('getZones', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no zones exist', async () => {
    const result = await getZones();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all zones', async () => {
    // Create test zones
    const testZoneInputs: CreateZoneInput[] = [
      {
        name_ar: 'منطقة الشمال',
        name_en: 'North District',
        polygon_or_center: '{"type":"Point","coordinates":[44.2126,15.3694]}',
        notes: 'Main service area'
      },
      {
        name_ar: 'منطقة الجنوب',
        name_en: 'South District',
        polygon_or_center: '{"type":"Polygon","coordinates":[[[44.1,15.3],[44.2,15.3],[44.2,15.4],[44.1,15.4],[44.1,15.3]]]}',
        notes: null
      },
      {
        name_ar: 'منطقة الشرق',
        name_en: 'East District',
        polygon_or_center: '{"type":"Point","coordinates":[44.3126,15.2694]}',
        notes: 'Premium area'
      }
    ];

    // Insert zones into database
    for (const zoneInput of testZoneInputs) {
      await db.insert(zonesTable)
        .values({
          name_ar: zoneInput.name_ar,
          name_en: zoneInput.name_en,
          polygon_or_center: zoneInput.polygon_or_center,
          notes: zoneInput.notes
        })
        .execute();
    }

    const result = await getZones();

    // Verify result structure
    expect(result).toHaveLength(3);
    expect(Array.isArray(result)).toBe(true);

    // Check each zone has required fields
    result.forEach(zone => {
      expect(zone.id).toBeDefined();
      expect(typeof zone.id).toBe('number');
      expect(typeof zone.name_ar).toBe('string');
      expect(typeof zone.name_en).toBe('string');
      expect(typeof zone.polygon_or_center).toBe('string');
      expect(zone.created_at).toBeInstanceOf(Date);
      
      // notes can be null or string
      expect(['string', 'object']).toContain(typeof zone.notes); // null is typeof 'object'
    });

    // Verify specific zone data
    const northZone = result.find(z => z.name_en === 'North District');
    expect(northZone).toBeDefined();
    expect(northZone!.name_ar).toBe('منطقة الشمال');
    expect(northZone!.notes).toBe('Main service area');
    expect(northZone!.polygon_or_center).toBe('{"type":"Point","coordinates":[44.2126,15.3694]}');

    const southZone = result.find(z => z.name_en === 'South District');
    expect(southZone).toBeDefined();
    expect(southZone!.name_ar).toBe('منطقة الجنوب');
    expect(southZone!.notes).toBeNull();
    expect(southZone!.polygon_or_center).toBe('{"type":"Polygon","coordinates":[[[44.1,15.3],[44.2,15.3],[44.2,15.4],[44.1,15.4],[44.1,15.3]]]}');

    const eastZone = result.find(z => z.name_en === 'East District');
    expect(eastZone).toBeDefined();
    expect(eastZone!.name_ar).toBe('منطقة الشرق');
    expect(eastZone!.notes).toBe('Premium area');
  });

  it('should return zones in database insertion order', async () => {
    // Create zones in specific order
    const zone1Input = {
      name_ar: 'منطقة أولى',
      name_en: 'First Zone',
      polygon_or_center: '{"type":"Point","coordinates":[44.1,15.1]}',
      notes: 'First zone'
    };

    const zone2Input = {
      name_ar: 'منطقة ثانية',
      name_en: 'Second Zone',
      polygon_or_center: '{"type":"Point","coordinates":[44.2,15.2]}',
      notes: 'Second zone'
    };

    // Insert first zone
    await db.insert(zonesTable)
      .values(zone1Input)
      .execute();

    // Insert second zone
    await db.insert(zonesTable)
      .values(zone2Input)
      .execute();

    const result = await getZones();

    expect(result).toHaveLength(2);
    // Zones should be ordered by ID (insertion order by default)
    expect(result[0].name_en).toBe('First Zone');
    expect(result[1].name_en).toBe('Second Zone');
    expect(result[0].id).toBeLessThan(result[1].id);
  });

  it('should handle zones with complex GeoJSON polygons', async () => {
    const complexPolygonInput = {
      name_ar: 'منطقة معقدة',
      name_en: 'Complex Zone',
      polygon_or_center: '{"type":"Polygon","coordinates":[[[44.1,15.3],[44.15,15.35],[44.2,15.3],[44.25,15.32],[44.3,15.28],[44.2,15.25],[44.1,15.3]]]}',
      notes: 'Zone with complex polygon'
    };

    await db.insert(zonesTable)
      .values(complexPolygonInput)
      .execute();

    const result = await getZones();

    expect(result).toHaveLength(1);
    const zone = result[0];
    expect(zone.polygon_or_center).toBe(complexPolygonInput.polygon_or_center);
    
    // Verify it's valid JSON
    expect(() => JSON.parse(zone.polygon_or_center)).not.toThrow();
    
    const geoJson = JSON.parse(zone.polygon_or_center);
    expect(geoJson.type).toBe('Polygon');
    expect(Array.isArray(geoJson.coordinates)).toBe(true);
  });

  it('should verify database persistence after retrieval', async () => {
    const testZone = {
      name_ar: 'منطقة اختبار',
      name_en: 'Test Zone',
      polygon_or_center: '{"type":"Point","coordinates":[44.2,15.3]}',
      notes: 'Test persistence'
    };

    // Insert zone
    await db.insert(zonesTable)
      .values(testZone)
      .execute();

    // Retrieve via handler
    const handlerResult = await getZones();
    expect(handlerResult).toHaveLength(1);

    // Verify zone still exists in database with direct query
    const directQuery = await db.select()
      .from(zonesTable)
      .execute();

    expect(directQuery).toHaveLength(1);
    expect(directQuery[0].name_ar).toBe(testZone.name_ar);
    expect(directQuery[0].name_en).toBe(testZone.name_en);
    expect(directQuery[0].polygon_or_center).toBe(testZone.polygon_or_center);
    expect(directQuery[0].notes).toBe(testZone.notes);
  });
});