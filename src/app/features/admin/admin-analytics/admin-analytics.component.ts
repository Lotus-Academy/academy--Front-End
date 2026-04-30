import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartType, registerables, ChartOptions, ChartData } from 'chart.js';
import { forkJoin } from 'rxjs';
import {
  LucideAngularModule, Users, BookOpen, DollarSign,
  TrendingUp, Award, Clock, GraduationCap, ArrowUpRight, CheckCircle, PieChart
} from 'lucide-angular';
import { AdminAnalyticsService, DashboardStatsDTO } from '../../../core/services/admin-analytics.service';
import { AdminLayoutComponent } from "../../layouts/dashboard-layouts/admin-dashboard-layout/admin-dashboard-layout.component";

Chart.register(...registerables);

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, BaseChartDirective, CurrencyPipe, DecimalPipe, AdminLayoutComponent],
  templateUrl: './admin-analytics.component.html'
})
export class AdminAnalyticsComponent implements OnInit {
  private analyticsService = inject(AdminAnalyticsService);

  readonly icons = {
    Users, BookOpen, DollarSign, TrendingUp, Award, Clock, GraduationCap, ArrowUpRight, CheckCircle, PieChart
  };

  isLoading = signal<boolean>(true);
  stats = signal<DashboardStatsDTO | null>(null);
  topCourses = signal<any[]>([]);
  topInstructors = signal<any[]>([]);

  completionRate = signal<number>(0);
  circumference = 2 * Math.PI * 36;
  dashOffset = signal<number>(this.circumference);

  // --- CHART 1: Revenue Timeline (Line) ---
  public revenueChartType: 'line' = 'line';
  public revenueChartData: ChartData<'line'> = {
    datasets: [{ data: [], label: 'Revenue ($)', borderColor: '#d4af37', backgroundColor: 'rgba(212, 175, 55, 0.1)', fill: true, tension: 0.4, pointRadius: 4 }],
    labels: []
  };
  public revenueChartOptions: ChartOptions<'line'> = {
    responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } }, x: { grid: { display: false } } }
  };

  // --- CHART 2: User Demographics (Doughnut) ---
  public userDemographicsChartType: 'doughnut' = 'doughnut';
  public userDemographicsChartData: ChartData<'doughnut'> = {
    datasets: [{ data: [], backgroundColor: ['#1e293b', '#d4af37'], borderWidth: 0, hoverOffset: 4 }],
    labels: ['Students', 'Instructors']
  };
  public userDemographicsChartOptions: ChartOptions<'doughnut'> = {
    responsive: true, maintainAspectRatio: false, cutout: '75%',
    plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } } }
  };

  // --- CHART 3: Revenue Distribution (Doughnut) ---
  public distributionColors = ['#d4af37', '#10b981', '#3b82f6', '#8b5cf6', '#64748b'];

  public revenueDistributionChartType: 'doughnut' = 'doughnut';
  public revenueDistributionChartData: ChartData<'doughnut'> = {
    datasets: [{ data: [], backgroundColor: this.distributionColors, borderWidth: 0, hoverOffset: 4 }],
    labels: []
  };
  public revenueDistributionChartOptions: ChartOptions<'doughnut'> = {
    responsive: true, maintainAspectRatio: false, cutout: '75%',
    plugins: { legend: { display: false } }
  };

  // --- CHART 4: Student Registrations (Bar) ---
  public registrationsChartType: 'bar' = 'bar';
  public registrationsChartData: ChartData<'bar'> = {
    datasets: [{ data: [], label: 'New Students', backgroundColor: '#1e293b', borderRadius: 4 }],
    labels: []
  };
  public registrationsChartOptions: ChartOptions<'bar'> = {
    responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } }, x: { grid: { display: false } } }
  };

  ngOnInit(): void {
    this.loadDashboardData();
  }

  getLegendColor(index: number): string {
    return this.distributionColors[index % this.distributionColors.length];
  }

  getCourseTitle(course: any): string {
    return course.title || course.courseTitle || course.name || 'Unknown Course';
  }

  getCourseInstructor(course: any): string {
    return course.instructorName || course.instructor?.firstName + ' ' + course.instructor?.lastName || 'Platform';
  }

  getRevenueValue(item: any): number {
    return item.totalRevenue || item.revenue || item.amount || item.totalEarned || 0;
  }

  getInstructorName(instructor: any): string {
    if (instructor.instructorName) return instructor.instructorName;
    if (instructor.firstName) return `${instructor.firstName} ${instructor.lastName || ''}`;
    return 'Unknown Instructor';
  }

  getInstructorEmail(instructor: any): string {
    return instructor.email || instructor.instructorEmail || '';
  }

  getInstructorPicture(instructor: any): string {
    return instructor.profilePictureUrl || instructor.picture || '';
  }

  // ---------------------------------------------------------------------------
  // PARSEUR TIMELINE PAR TYPE DE DONNÉES (Ignorant les noms des clés)
  // ---------------------------------------------------------------------------
  private parseTimelineData(raw: any): { labels: string[], values: number[] } {
    const result = { labels: [] as string[], values: [] as number[] };

    if (!raw) return result;

    if (Array.isArray(raw)) {
      raw.forEach(item => {
        let dateFound: string | null = null;
        let valFound: number | null = null;

        // Analyser chaque valeur de l'objet
        Object.values(item).forEach((val: any) => {
          if (val === null || val === undefined) return;

          // Si c'est un nombre (et pas le premier trouvé), on le garde comme valeur
          if (typeof val === 'number' && valFound === null) {
            valFound = val;
          }
          // Si c'est une string qui peut être convertie en nombre, c'est aussi une valeur potentielle
          else if (typeof val === 'string' && !isNaN(Number(val)) && valFound === null) {
            valFound = Number(val);
          }
          // Si c'est une string qui ressemble à une date (contient des tirets ou commence par 202)
          else if (typeof val === 'string' && (val.includes('-') || val.includes('/')) && dateFound === null) {
            // Vérifier rudimentairement si c'est bien une date
            if (!isNaN(Date.parse(val))) {
              dateFound = val;
            }
          }
        });

        // Si on a trouvé une date et une valeur, on ajoute au graphique
        if (dateFound !== null && valFound !== null) {
          result.labels.push(this.formatShortDate(dateFound));
          result.values.push(valFound);
        } else {
          // Si on n'a pas pu déterminer automatiquement, on logue pour analyse manuelle
          console.warn("Format d'élément inattendu dans la timeline:", item);
        }
      });
    } else if (typeof raw === 'object') {
      // Si c'est un Map { "2026-04-01": 100 }
      for (const [key, value] of Object.entries(raw)) {
        result.labels.push(this.formatShortDate(key));
        if (typeof value === 'number') {
          result.values.push(value);
        } else if (typeof value === 'string' && !isNaN(Number(value))) {
          result.values.push(Number(value));
        } else {
          result.values.push(0);
        }
      }
    }

    return result;
  }

  private loadDashboardData(): void {
    this.isLoading.set(true);

    const endDate = new Date().toISOString();
    const startDate = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString();

    forkJoin({
      stats: this.analyticsService.getDashboardStats(),
      revenue: this.analyticsService.getPlatformRevenueStats('DAY', startDate, endDate),
      registrations: this.analyticsService.getUserRegistrationStats('STUDENT', 'DAY', startDate, endDate),
      topCourses: this.analyticsService.getRevenueByCourse(0, 5),
      topInstructors: this.analyticsService.getRevenueByInstructor(0, 5)
    }).subscribe({
      next: (results) => {
        this.stats.set(results.stats);

        if (results.stats.totalEnrollments > 0) {
          const rate = (results.stats.totalCertificatesIssued / results.stats.totalEnrollments) * 100;
          this.completionRate.set(rate);
          this.dashOffset.set(this.circumference - (rate / 100) * this.circumference);
        }

        this.userDemographicsChartData = {
          labels: ['Students', 'Instructors'],
          datasets: [{ ...this.userDemographicsChartData.datasets[0], data: [results.stats.totalStudents, results.stats.totalInstructors] }]
        };

        // --- UTILISATION DU NOUVEAU PARSEUR ---
        const parsedRevenue = this.parseTimelineData(results.revenue);
        this.revenueChartData = {
          labels: parsedRevenue.labels,
          datasets: [{ ...this.revenueChartData.datasets[0], data: parsedRevenue.values }]
        };

        const parsedRegs = this.parseTimelineData(results.registrations);
        this.registrationsChartData = {
          labels: parsedRegs.labels,
          datasets: [{ ...this.registrationsChartData.datasets[0], data: parsedRegs.values }]
        };

        // ASSIGNATION DES TOPS
        const coursesData = results.topCourses.content || results.topCourses || [];
        const instructorsData = results.topInstructors.content || results.topInstructors || [];

        this.topCourses.set(coursesData);
        this.topInstructors.set(instructorsData);

        // GRAPHIQUE CIRCULAIRE DES REVENUS
        if (coursesData.length > 0) {
          const top5Revenue = coursesData.reduce((sum: number, c: any) => sum + this.getRevenueValue(c), 0);
          const othersRevenue = Math.max(0, results.stats.totalRevenue - top5Revenue);

          const labels = coursesData.map((c: any) => this.getCourseTitle(c)).concat(['Others']);
          const data = coursesData.map((c: any) => this.getRevenueValue(c)).concat([othersRevenue]);

          this.revenueDistributionChartData = {
            labels: labels,
            datasets: [{ ...this.revenueDistributionChartData.datasets[0], data: data }]
          };
        }

        this.isLoading.set(false);
      },
      error: (err) => {
        console.error("Error compiling analytics", err);
        this.isLoading.set(false);
      }
    });
  }

  private formatShortDate(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return String(dateString);
      return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })}`;
    } catch {
      return String(dateString);
    }
  }
}