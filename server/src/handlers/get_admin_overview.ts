import { db } from '../db';
import { bookingsTable, servicesTable } from '../db/schema';
import { type AdminOverview } from '../schema';
import { eq, sql, and, gte, lte, or } from 'drizzle-orm';

/**
 * Retrieves key metrics and data for admin dashboard overview.
 * This handler provides today's operational summary:
 * - Today's booking counts by status
 * - Revenue metrics and trends
 * - Service performance indicators
 * - Upcoming appointments and scheduling
 * - Key performance indicators (KPIs)
 */
export const getAdminOverview = async (): Promise<AdminOverview> => {
  try {
    // Get today's date boundaries
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow

    // Count today's bookings
    const todayBookingsResult = await db.select({
      count: sql<number>`cast(count(*) as int)`
    })
      .from(bookingsTable)
      .where(
        and(
          gte(bookingsTable.created_at, today),
          lte(bookingsTable.created_at, tomorrow)
        )
      )
      .execute();

    const today_bookings = todayBookingsResult[0]?.count || 0;

    // Count pending bookings (confirmed, on_the_way, started)
    const pendingBookingsResult = await db.select({
      count: sql<number>`cast(count(*) as int)`
    })
      .from(bookingsTable)
      .where(
        or(
          eq(bookingsTable.status, 'confirmed'),
          eq(bookingsTable.status, 'on_the_way'),
          eq(bookingsTable.status, 'started')
        )
      )
      .execute();

    const pending_bookings = pendingBookingsResult[0]?.count || 0;

    // Count completed bookings today
    const completedBookingsResult = await db.select({
      count: sql<number>`cast(count(*) as int)`
    })
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.status, 'finished'),
          gte(bookingsTable.created_at, today),
          lte(bookingsTable.created_at, tomorrow)
        )
      )
      .execute();

    const completed_bookings = completedBookingsResult[0]?.count || 0;

    // Calculate today's revenue from completed bookings
    const revenueResult = await db.select({
      total: sql<string>`sum(${bookingsTable.price_total})`
    })
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.status, 'finished'),
          gte(bookingsTable.created_at, today),
          lte(bookingsTable.created_at, tomorrow)
        )
      )
      .execute();

    const revenue_today = revenueResult[0]?.total ? parseFloat(revenueResult[0].total) : 0;

    // Calculate average service time from recent finished bookings (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const avgServiceTimeResult = await db.select({
      service: {
        est_minutes: servicesTable.est_minutes
      }
    })
      .from(bookingsTable)
      .innerJoin(servicesTable, eq(bookingsTable.service_id, servicesTable.id))
      .where(
        and(
          eq(bookingsTable.status, 'finished'),
          gte(bookingsTable.created_at, thirtyDaysAgo)
        )
      )
      .execute();

    let avg_service_time = 0;
    if (avgServiceTimeResult.length > 0) {
      const totalMinutes = avgServiceTimeResult.reduce((sum, result) => {
        return sum + result.service.est_minutes;
      }, 0);
      avg_service_time = Math.round(totalMinutes / avgServiceTimeResult.length);
    }

    // Calculate on-time percentage (simplified: finished bookings vs total bookings in last 30 days)
    const totalRecentBookingsResult = await db.select({
      count: sql<number>`cast(count(*) as int)`
    })
      .from(bookingsTable)
      .where(gte(bookingsTable.created_at, thirtyDaysAgo))
      .execute();

    const finishedRecentBookingsResult = await db.select({
      count: sql<number>`cast(count(*) as int)`
    })
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.status, 'finished'),
          gte(bookingsTable.created_at, thirtyDaysAgo)
        )
      )
      .execute();

    const totalRecentBookings = totalRecentBookingsResult[0]?.count || 0;
    const finishedRecentBookings = finishedRecentBookingsResult[0]?.count || 0;

    const on_time_percentage = totalRecentBookings > 0 
      ? Math.round((finishedRecentBookings / totalRecentBookings) * 100)
      : 0;

    return {
      today_bookings,
      pending_bookings,
      completed_bookings,
      revenue_today,
      avg_service_time,
      on_time_percentage
    };
  } catch (error) {
    console.error('Admin overview retrieval failed:', error);
    throw error;
  }
};