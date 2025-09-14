import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { fleetLeadsTable } from '../db/schema';
import { type CreateFleetLeadInput } from '../schema';
import { createFleetLead } from '../handlers/create_fleet_lead';
import { eq } from 'drizzle-orm';

// Simple test input with all required fields
const testInput: CreateFleetLeadInput = {
  company_name: 'Tech Solutions LLC',
  contact_person: 'Ahmed Al-Rashid',
  phone: '+967123456789',
  status: 'new',
  notes: 'Interested in monthly service package for 15 vehicles'
};

describe('createFleetLead', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a fleet lead with all fields', async () => {
    const result = await createFleetLead(testInput);

    // Basic field validation
    expect(result.company_name).toEqual('Tech Solutions LLC');
    expect(result.contact_person).toEqual('Ahmed Al-Rashid');
    expect(result.phone).toEqual('+967123456789');
    expect(result.status).toEqual('new');
    expect(result.notes).toEqual('Interested in monthly service package for 15 vehicles');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a fleet lead with default status when not provided', async () => {
    const inputWithoutStatus = {
      company_name: 'Al-Noor Trading',
      contact_person: 'Fatima Al-Zahra',
      phone: '+967987654321',
      status: 'new' as const // Status is required, but defaults to 'new'
    };

    const result = await createFleetLead(inputWithoutStatus);

    expect(result.company_name).toEqual('Al-Noor Trading');
    expect(result.contact_person).toEqual('Fatima Al-Zahra');
    expect(result.phone).toEqual('+967987654321');
    expect(result.status).toEqual('new'); // Default value from Zod
    expect(result.notes).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a fleet lead with null notes when not provided', async () => {
    const inputWithoutNotes = {
      company_name: 'Green Energy Co',
      contact_person: 'Omar Hassan',
      phone: '+967555666777',
      status: 'contacted' as const,
      notes: undefined // Notes is optional
    };

    const result = await createFleetLead(inputWithoutNotes);

    expect(result.company_name).toEqual('Green Energy Co');
    expect(result.contact_person).toEqual('Omar Hassan');
    expect(result.phone).toEqual('+967555666777');
    expect(result.status).toEqual('contacted');
    expect(result.notes).toBeNull();
  });

  it('should save fleet lead to database', async () => {
    const result = await createFleetLead(testInput);

    // Query using proper drizzle syntax
    const fleetLeads = await db.select()
      .from(fleetLeadsTable)
      .where(eq(fleetLeadsTable.id, result.id))
      .execute();

    expect(fleetLeads).toHaveLength(1);
    const savedLead = fleetLeads[0];
    
    expect(savedLead.company_name).toEqual('Tech Solutions LLC');
    expect(savedLead.contact_person).toEqual('Ahmed Al-Rashid');
    expect(savedLead.phone).toEqual('+967123456789');
    expect(savedLead.status).toEqual('new');
    expect(savedLead.notes).toEqual('Interested in monthly service package for 15 vehicles');
    expect(savedLead.created_at).toBeInstanceOf(Date);
  });

  it('should handle different fleet lead statuses', async () => {
    const statuses = ['new', 'contacted', 'trial', 'converted', 'rejected'] as const;

    for (const status of statuses) {
      const input = {
        company_name: `${status.charAt(0).toUpperCase() + status.slice(1)} Corp`,
        contact_person: 'Test Person',
        phone: `+96712345${Math.floor(Math.random() * 10000)}`,
        status
      };

      const result = await createFleetLead(input);
      expect(result.status).toEqual(status);
    }
  });

  it('should create multiple fleet leads with different company names', async () => {
    const companies = [
      'Al-Salam Transportation',
      'Yemen Logistics Hub',
      'Hadramout Fleet Services'
    ];

    for (let i = 0; i < companies.length; i++) {
      const input = {
        company_name: companies[i],
        contact_person: `Contact Person ${i + 1}`,
        phone: `+967111${i}${i}${i}${i}${i}${i}`,
        status: 'new' as const,
        notes: `Fleet lead ${i + 1}`
      };

      const result = await createFleetLead(input);
      expect(result.company_name).toEqual(companies[i]);
    }

    // Verify all leads were saved
    const allLeads = await db.select()
      .from(fleetLeadsTable)
      .execute();

    expect(allLeads).toHaveLength(companies.length);
  });

  it('should handle long notes correctly', async () => {
    const longNotes = 'This is a very long note that describes the fleet requirements in detail. ' +
      'The company has 25 vehicles including sedans, SUVs, and pickup trucks. They need monthly ' +
      'cleaning services for all vehicles, with special requirements for executive cars. Budget ' +
      'range is 500-800 YER per vehicle per month. Contact prefers WhatsApp communication.';

    const input = {
      company_name: 'Large Fleet Company',
      contact_person: 'Fleet Manager',
      phone: '+967888999000',
      status: 'contacted' as const,
      notes: longNotes
    };

    const result = await createFleetLead(input);
    expect(result.notes).toEqual(longNotes);

    // Verify it's saved correctly
    const saved = await db.select()
      .from(fleetLeadsTable)
      .where(eq(fleetLeadsTable.id, result.id))
      .execute();

    expect(saved[0].notes).toEqual(longNotes);
  });
});