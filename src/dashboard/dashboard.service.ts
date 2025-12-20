import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Role, ReservationStatus } from '@prisma/client';
import { ReservationsService } from '../reservations/reservations.service';
import { TripReservationsService } from '../trip-reservations/trip-reservations.service';
import { PreferencesService } from '../preferences/preferences.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reservationsService: ReservationsService,
    private readonly tripReservationsService: TripReservationsService,
    private readonly preferencesService: PreferencesService,
  ) {}

  // Guest Dashboard - Public data
  async getGuestDashboard() {
    const [countries, cities, places, activities, hotels, trips] =
      await Promise.all([
        this.prisma.country.count(),
        this.prisma.city.count(),
        this.prisma.place.count(),
        this.prisma.activity.count(),
        this.prisma.hotel.count(),
        this.prisma.trip.count(),
      ]);

    const recentPlaces = await this.prisma.place.findMany({
      take: 6,
      orderBy: { popularity: 'desc' },
      include: {
        city: {
          include: {
            country: true,
          },
        },
        categories: true,
        themes: true,
      },
    });

    const featuredTrips = await this.prisma.trip.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        city: {
          include: {
            country: true,
          },
        },
        hotel: true,
        activities: true,
      },
    });

    const featuredHotels = await this.prisma.hotel.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        city: {
          include: {
            country: true,
          },
        },
      },
    });

    return {
      statistics: {
        countries,
        cities,
        places,
        activities,
        hotels,
        trips,
      },
      featured: {
        places: recentPlaces,
        trips: featuredTrips,
        hotels: featuredHotels,
      },
    };
  }

  // User Dashboard - Personal data
  async getUserDashboard(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        preferences: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const [
      hotelReservations,
      tripReservations,
      pendingReservations,
      confirmedReservations,
      cancelledReservations,
    ] = await Promise.all([
      this.reservationsService.findAllForUser(userId),
      this.tripReservationsService.findAllForUser(userId),
      this.getReservationCountByStatus(userId, ReservationStatus.PENDING),
      this.getReservationCountByStatus(userId, ReservationStatus.CONFIRMED),
      this.getReservationCountByStatus(userId, ReservationStatus.CANCELLED),
    ]);

    const totalSpent = await this.calculateTotalSpent(userId);

    const upcomingReservations = [
      ...hotelReservations.filter(
        (r) =>
          r.status === ReservationStatus.CONFIRMED &&
          new Date(r.endDate) >= new Date(),
      ),
      ...tripReservations.filter(
        (r) =>
          r.status === ReservationStatus.CONFIRMED &&
          new Date(r.createdAt) >= new Date(),
      ),
    ].sort((a, b) => {
      const dateA =
        'startDate' in a ? new Date(a.startDate) : new Date(a.createdAt);
      const dateB =
        'startDate' in b ? new Date(b.startDate) : new Date(b.createdAt);
      return dateA.getTime() - dateB.getTime();
    });

    return {
      user,
      statistics: {
        totalReservations: hotelReservations.length + tripReservations.length,
        hotelReservations: hotelReservations.length,
        tripReservations: tripReservations.length,
        pending: pendingReservations,
        confirmed: confirmedReservations,
        cancelled: cancelledReservations,
        totalSpent,
      },
      reservations: {
        hotels: hotelReservations,
        trips: tripReservations,
        upcoming: upcomingReservations.slice(0, 5),
      },
    };
  }

  // Admin Dashboard - System-wide data
  async getAdminDashboard() {
    const [
      totalUsers,
      totalCountries,
      totalCities,
      totalPlaces,
      totalActivities,
      totalHotels,
      totalTrips,
      totalReservations,
      totalTripReservations,
      pendingReservations,
      confirmedReservations,
      cancelledReservations,
      recentUsers,
      recentReservations,
      recentTripReservations,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.country.count(),
      this.prisma.city.count(),
      this.prisma.place.count(),
      this.prisma.activity.count(),
      this.prisma.hotel.count(),
      this.prisma.trip.count(),
      this.prisma.reservation.count(),
      this.prisma.tripReservation.count(),
      this.prisma.reservation.count({
        where: { status: ReservationStatus.PENDING },
      }),
      this.prisma.reservation.count({
        where: { status: ReservationStatus.CONFIRMED },
      }),
      this.prisma.reservation.count({
        where: { status: ReservationStatus.CANCELLED },
      }),
      this.prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
        this.prisma.reservation.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        }),
      this.prisma.tripReservation.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
          trip: true,
        },
      }),
    ]);

    const revenueStats = await this.calculateRevenueStats();
    const popularDestinations = await this.getPopularDestinations();
    const reservationTrends = await this.getReservationTrends();

    return {
      statistics: {
        users: {
          total: totalUsers,
          admins: await this.prisma.user.count({
            where: { role: Role.ADMIN },
          }),
          regular: await this.prisma.user.count({
            where: { role: Role.USER },
          }),
        },
        content: {
          countries: totalCountries,
          cities: totalCities,
          places: totalPlaces,
          activities: totalActivities,
          hotels: totalHotels,
          trips: totalTrips,
        },
        reservations: {
          total: totalReservations + totalTripReservations,
          hotel: totalReservations,
          trip: totalTripReservations,
          pending: pendingReservations,
          confirmed: confirmedReservations,
          cancelled: cancelledReservations,
        },
        revenue: revenueStats,
      },
      recent: {
        users: recentUsers,
        reservations: recentReservations,
        tripReservations: recentTripReservations,
      },
      insights: {
        popularDestinations,
        reservationTrends,
      },
    };
  }

  private async getReservationCountByStatus(
    userId: string,
    status: ReservationStatus,
  ): Promise<number> {
    const [hotelCount, tripCount] = await Promise.all([
      this.prisma.reservation.count({
        where: { userId, status },
      }),
      this.prisma.tripReservation.count({
        where: { userId, status },
      }),
    ]);

    return hotelCount + tripCount;
  }

  private async calculateTotalSpent(userId: string): Promise<number> {
    const [hotelReservations, tripReservations] = await Promise.all([
      this.prisma.reservation.findMany({
        where: {
          userId,
          status: ReservationStatus.CONFIRMED,
        },
        select: { totalPrice: true },
      }),
      this.prisma.tripReservation.findMany({
        where: {
          userId,
          status: ReservationStatus.CONFIRMED,
        },
        include: {
          trip: {
            select: { price: true },
          },
        },
      }),
    ]);

    const hotelTotal = hotelReservations.reduce(
      (sum, r) => sum + r.totalPrice,
      0,
    );
    const tripTotal = tripReservations.reduce(
      (sum, r) => sum + r.trip.price * r.guests,
      0,
    );

    return hotelTotal + tripTotal;
  }

  private async calculateRevenueStats() {
    const [confirmedHotelReservations, confirmedTripReservations] =
      await Promise.all([
        this.prisma.reservation.findMany({
          where: { status: ReservationStatus.CONFIRMED },
          select: { totalPrice: true, createdAt: true },
        }),
        this.prisma.tripReservation.findMany({
          where: { status: ReservationStatus.CONFIRMED },
          select: {
            guests: true,
            createdAt: true,
            trip: {
              select: { price: true },
            },
          },
        }),
      ]);

    const hotelRevenue = confirmedHotelReservations.reduce(
      (sum, r) => sum + r.totalPrice,
      0,
    );
    const tripRevenue = confirmedTripReservations.reduce(
      (sum, r) => sum + r.trip.price * r.guests,
      0,
    );

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const thisMonthHotel = confirmedHotelReservations
      .filter((r) => new Date(r.createdAt) >= thisMonth)
      .reduce((sum, r) => sum + r.totalPrice, 0);

    const thisMonthTrip = confirmedTripReservations
      .filter((r) => new Date(r.createdAt) >= thisMonth)
      .reduce((sum, r) => sum + r.trip.price * r.guests, 0);

    const lastMonthHotel = confirmedHotelReservations
      .filter(
        (r) =>
          new Date(r.createdAt) >= lastMonth &&
          new Date(r.createdAt) < thisMonth,
      )
      .reduce((sum, r) => sum + r.totalPrice, 0);

    const lastMonthTrip = confirmedTripReservations
      .filter(
        (r) =>
          new Date(r.createdAt) >= lastMonth &&
          new Date(r.createdAt) < thisMonth,
      )
      .reduce((sum, r) => sum + r.trip.price * r.guests, 0);

    return {
      total: hotelRevenue + tripRevenue,
      hotel: hotelRevenue,
      trip: tripRevenue,
      thisMonth: thisMonthHotel + thisMonthTrip,
      lastMonth: lastMonthHotel + lastMonthTrip,
      growth:
        lastMonthHotel + lastMonthTrip > 0
          ? ((thisMonthHotel + thisMonthTrip - (lastMonthHotel + lastMonthTrip)) /
              (lastMonthHotel + lastMonthTrip)) *
            100
          : 0,
    };
  }

  private async getPopularDestinations() {
    const cities = await this.prisma.city.findMany({
      include: {
        country: true,
        _count: {
          select: {
            places: true,
            hotels: true,
            trips: true,
          },
        },
      },
      take: 10,
    });

    // Sort by total content (places + hotels + trips)
    const sortedCities = cities.sort((a, b) => {
      const totalA =
        a._count.places + a._count.hotels + a._count.trips;
      const totalB =
        b._count.places + b._count.hotels + b._count.trips;
      return totalB - totalA;
    });

    return sortedCities.map((city) => ({
      id: city.id,
      name: city.name,
      country: city.country.name,
      places: city._count.places,
      hotels: city._count.hotels,
      trips: city._count.trips,
    }));
  }

  private async getReservationTrends() {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [last7DaysReservations, last30DaysReservations] = await Promise.all([
      this.prisma.reservation.count({
        where: {
          createdAt: { gte: last7Days },
        },
      }),
      this.prisma.reservation.count({
        where: {
          createdAt: { gte: last30Days },
        },
      }),
    ]);

    const [last7DaysTripReservations, last30DaysTripReservations] =
      await Promise.all([
        this.prisma.tripReservation.count({
          where: {
            createdAt: { gte: last7Days },
          },
        }),
        this.prisma.tripReservation.count({
          where: {
            createdAt: { gte: last30Days },
          },
        }),
      ]);

    return {
      last7Days: {
        hotel: last7DaysReservations,
        trip: last7DaysTripReservations,
        total: last7DaysReservations + last7DaysTripReservations,
      },
      last30Days: {
        hotel: last30DaysReservations,
        trip: last30DaysTripReservations,
        total: last30DaysReservations + last30DaysTripReservations,
      },
    };
  }
}

