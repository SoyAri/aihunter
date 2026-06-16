import { Component, OnInit, signal, computed } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

interface UserPreferences {
  occupation?: string;
  useCases: string[];
  contentTypes: string[];
  techLevel?: string;
  categories: string[];
}

interface AITool {
  id: number;
  tool: string;
  tool_description: string;
  tool_image_url: string;
  category: string;
  upvotes: number;
  tags: string;
}

interface Occupation {
  id: number;
  occupation_name: string;
}

const supabase: SupabaseClient = createClient(
  environment.supabaseUrl,
  environment.supabaseAnonKey
);

@Component({
  selector: 'app-inicio',
  imports: [],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio implements OnInit {
  currentStep = signal(0);
  allOccupations = signal<Occupation[]>([]);
  occupationSearch = signal('');
  filteredOccupations = computed(() => {
    const search = this.occupationSearch().toLowerCase().trim();
    if (!search) return this.allOccupations();
    return this.allOccupations().filter(o =>
      o.occupation_name.toLowerCase().includes(search)
    );
  });

  preferences = signal<UserPreferences>({
    occupation: undefined,
    useCases: [],
    contentTypes: [],
    techLevel: undefined,
    categories: [],
  });

  recommendations = signal<AITool[]>([]);
  isLoading = signal(false);
  isComplete = signal(false);
  errorMsg = signal<string | null>(null);

  readonly USE_CASES = [
    'Productividad & Trabajo',
    'Aprendizaje & Investigación',
    'Programación',
    'Arte & Creatividad',
    'Marketing & Redes Sociales',
    'Entretenimiento',
  ];

  readonly CONTENT_TYPES = [
    'Texto & Chat',
    'Imágenes',
    'Video',
    'Audio & Música',
    'Código',
    'Datos & Finanzas',
    'Ninguno en particular',
  ];

  readonly TECH_LEVELS = [
    { label: 'Principiante', icon: '🌱', desc: 'Justo empezando con la IA' },
    { label: 'Intermedio', icon: '⚡', desc: 'Ya uso algunas herramientas' },
    { label: 'Avanzado', icon: '🚀', desc: 'Domino múltiples herramientas' },
  ];

  readonly CATEGORIES = [
    'Arte generativo',
    'Charlar',
    'Código generativo',
    'Productividad',
    'Marketing',
    'Música',
    'Vídeo generativo',
    'Investigación',
    'Redacción',
    'Redes Sociales',
    'Para Divertirse',
    'Texto a voz',
    'Traducción',
    'Superación personal',
    'Mejora de imagen',
  ];

  async ngOnInit() {
    const saved = this.loadPrefs();
    await this.loadOccupations();
    if (saved) {
      this.preferences.set(saved);
      await this.getRecommendations();
    }
  }

  private async loadOccupations() {
    const pageSize = 1000;
    let from = 0;
    let all: Occupation[] = [];

    while (true) {
      const { data } = await supabase
        .from('occupations')
        .select('*')
        .order('occupation_name')
        .range(from, from + pageSize - 1);

      if (!data || data.length === 0) break;
      all = [...all, ...(data as Occupation[])];
      if (data.length < pageSize) break;
      from += pageSize;
    }

    this.allOccupations.set(all);
  }

  onSearchChange(event: Event) {
    this.occupationSearch.set((event.target as HTMLInputElement).value);
  }

  selectOccupation(name: string) {
    this.preferences.update(p => ({ ...p, occupation: name }));
  }

  clearOccupation() {
    this.preferences.update(p => ({ ...p, occupation: undefined }));
  }

  toggleUseCase(value: string) {
    this.preferences.update(p => ({
      ...p,
      useCases: p.useCases.includes(value)
        ? p.useCases.filter(v => v !== value)
        : [...p.useCases, value],
    }));
  }

  toggleContentType(value: string) {
    this.preferences.update(p => ({
      ...p,
      contentTypes: p.contentTypes.includes(value)
        ? p.contentTypes.filter(v => v !== value)
        : [...p.contentTypes, value],
    }));
  }

  selectTechLevel(value: string) {
    this.preferences.update(p => ({
      ...p,
      techLevel: p.techLevel === value ? undefined : value,
    }));
  }

  toggleCategory(value: string) {
    this.preferences.update(p => ({
      ...p,
      categories: p.categories.includes(value)
        ? p.categories.filter(v => v !== value)
        : [...p.categories, value],
    }));
  }

  canProceed(): boolean {
    const step = this.currentStep();
    const prefs = this.preferences();
    if (step === 0) return !!prefs.occupation;
    if (step === 1) return prefs.useCases.length > 0;
    return true;
  }

  isOptionalStep(): boolean {
    return this.currentStep() >= 2;
  }

  next() {
    if (this.currentStep() < 4) {
      this.currentStep.update(s => s + 1);
    } else {
      this.finish();
    }
  }

  back() {
    if (this.currentStep() > 0) {
      this.currentStep.update(s => s - 1);
    }
  }

  skip() {
    if (this.currentStep() < 4) {
      this.currentStep.update(s => s + 1);
    } else {
      this.finish();
    }
  }

  private async finish() {
    this.savePrefs(this.preferences());
    await this.getRecommendations();
  }

  private async getRecommendations() {
    this.isLoading.set(true);
    this.errorMsg.set(null);
    try {
      const { data, error } = await supabase.functions.invoke('recommend-tools', {
        body: this.preferences(),
      });
      if (error) throw error;
      this.recommendations.set((data as AITool[]) ?? []);
      this.isComplete.set(true);
    } catch (err) {
      this.errorMsg.set('No se pudieron cargar las recomendaciones. Inténtalo de nuevo.');
    } finally {
      this.isLoading.set(false);
    }
  }

  editPreferences() {
    this.isComplete.set(false);
    this.currentStep.set(0);
  }

  clearPrefs() {
    localStorage.removeItem('aihunter_prefs');
    this.preferences.set({
      occupation: undefined,
      useCases: [],
      contentTypes: [],
      techLevel: undefined,
      categories: [],
    });
    this.isComplete.set(false);
    this.isLoading.set(false);
    this.errorMsg.set(null);
    this.currentStep.set(0);
  }

  hideImage(event: Event) {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  private savePrefs(p: UserPreferences) {
    localStorage.setItem('aihunter_prefs', JSON.stringify(p));
  }

  private loadPrefs(): UserPreferences | null {
    const raw = localStorage.getItem('aihunter_prefs');
    return raw ? JSON.parse(raw) : null;
  }
}
