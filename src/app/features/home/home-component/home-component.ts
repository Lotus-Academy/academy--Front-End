import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  ArrowRight,
  Play,
  TrendingUp,
  Users,
  Award,
  BarChart3,
  Brain,
  Shield,
  Heart,
  Database,
  BookOpen,
  Star
} from 'lucide-angular';
import { NavbarComponent } from "../../layouts/navbar-component/navbar-component";
import { FooterComponent } from "../../layouts/footer-component/footer-component";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, NavbarComponent, FooterComponent],
  templateUrl: './home-component.html',
  styleUrls: ['./home-component.css']
})
export class HomeComponent {
  // Déclaration des icônes pour le template
  readonly icons = {
    ArrowRight, Play, TrendingUp, Users, Award,
    BarChart3, Brain, Shield, Heart, Database, BookOpen, Star
  };

  stats = [
    { icon: Users, value: "50,000+", label: "Students" },
    { icon: TrendingUp, value: "200+", label: "Courses" },
    { icon: Award, value: "4.9", label: "Avg Rating" },
  ];

  topics = [
    { name: "Algorithmic Trading", icon: TrendingUp, courses: 45, color: "bg-blue-500/10 text-blue-500" },
    { name: "Quantitative Finance", icon: BarChart3, courses: 32, color: "bg-green-500/10 text-green-500" },
    { name: "Machine Learning", icon: Brain, courses: 28, color: "bg-yellow-500/10 text-yellow-500" },
    { name: "Risk Management", icon: Shield, courses: 24, color: "bg-red-500/10 text-red-500" },
    { name: "Trading Psychology", icon: Heart, courses: 18, color: "bg-purple-500/10 text-purple-500" },
  ];

  activeIndex: number | null = null;

  faqs = [
    {
      question: "How do I get started with Lotus Academy?",
      answer: "Simply create a free account, browse our course catalog, and enroll in any course that interests you."
    },
    {
      question: "Are certificates provided upon course completion?",
      answer: "Yes, you'll receive a verified certificate of completion with a unique QR code for each course you finish."
    }
  ];

  toggleFaq(index: number) {
    this.activeIndex = this.activeIndex === index ? null : index;
  }

  // Données statiques pour les cours à la une
  // Respecte le schéma CourseResponseDTO de votre API
  featuredCourses = [
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Algorithmic Trading Fundamentals: From Zero to Hero',
      instructorName: 'Dr. Sarah Chen',
      thumbnailUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop',
      price: 0,
      categoryName: 'Algorithmic Trading',
      level: 'Beginner'
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174001',
      title: 'Advanced Python for Quantitative Finance',
      instructorName: 'Michael Roberts',
      thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=450&fit=crop',
      price: 79.99,
      categoryName: 'Programming',
      level: 'Intermediate'
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174002',
      title: 'Risk Management & Portfolio Optimization',
      instructorName: 'Prof. James Wilson',
      thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop',
      price: 129.00,
      categoryName: 'Risk Management',
      level: 'Advanced'
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174003',
      title: 'Machine Learning for Trading Strategies',
      instructorName: 'Dr. Emily Zhang',
      thumbnailUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop',
      price: 149.50,
      categoryName: 'Machine Learning',
      level: 'Advanced'
    }
  ];

  // Données statiques pour les témoignages
  testimonials = [
    {
      name: 'Alex Thompson',
      role: 'Quantitative Analyst at Goldman Sachs',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      content: "Lotus Academy's courses gave me the practical skills I needed to advance my career. The instructors are world-class.",
      rating: 5
    },
    {
      name: 'Maria Garcia',
      role: 'Independent Trader',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
      content: "The algorithmic trading course helped me automate my strategies and significantly improve my returns. Worth every penny!",
      rating: 5
    },
    {
      name: 'David Chen',
      role: 'Portfolio Manager',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      content: "The risk management course completely changed how I approach portfolio construction. The expertise shared here is unmatched.",
      rating: 5
    }
  ];
}