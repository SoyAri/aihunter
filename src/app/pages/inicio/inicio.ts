import { Component, effect, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PreferencesService } from '../../services/preferences.service';
import { SupabaseService } from '../../services/supabase.service';
import { AITool, Occupation, UserPreferences, emptyPreferences } from '../../models/preferences.model';

interface GuestSection {
  label: string;
  icon: string;
  tools: AITool[];
}

@Component({
  selector: 'app-inicio',
  imports: [RouterLink],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio {
  readonly GUEST_CATEGORIES: { label: string; category: string; icon: string }[] = [
    { label: 'Programación', category: 'Código generativo', icon: 'code' },
    { label: 'General', category: 'Charlar', icon: 'forum' },
    { label: 'Imágenes', category: 'Arte generativo', icon: 'palette' },
    { label: 'Productividad', category: 'Productividad', icon: 'bolt' },
  ];

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

  preferences = signal<UserPreferences>(emptyPreferences());

  recommendations = signal<AITool[]>([]);
  isLoading = signal(false);
  isComplete = signal(false);
  errorMsg = signal<string | null>(null);

  guestSections = signal<GuestSection[]>([]);
  guestLoading = signal(false);

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

  private lastUserId: string | null | undefined = undefined;

  constructor(
    protected authService: AuthService,
    private preferencesService: PreferencesService,
    private supabaseService: SupabaseService
  ) {
    effect(() => {
      const uid = this.authService.user()?.id ?? null;
      if (uid === this.lastUserId) return;
      this.lastUserId = uid;

      if (uid) {
        this.enterAccountMode(uid);
      } else {
        this.enterGuestMode();
      }
    });
  }

  private resetWizardState() {
    this.currentStep.set(0);
    this.preferences.set(emptyPreferences());
    this.recommendations.set([]);
    this.isLoading.set(false);
    this.isComplete.set(false);
    this.errorMsg.set(null);
  }

  private async enterAccountMode(userId: string) {
    this.resetWizardState();
    await this.loadOccupations();
    const saved = await this.preferencesService.getPreferences(userId);
    if (saved) {
      this.preferences.set(saved);
      await this.getRecommendations();
    }
  }

  private enterGuestMode() {
    this.resetWizardState();
    this.loadGuestRecommendations();
  }

  private async loadGuestRecommendations() {
    this.guestLoading.set(true);
    this.errorMsg.set(null);
    try {
      const sections = await Promise.all(
        this.GUEST_CATEGORIES.map(async ({ label, category, icon }) => {
          const { data, error } = await this.supabaseService.client.functions.invoke(
            'recommend-tools',
            {
              body: {
                occupation: undefined,
                useCases: [],
                contentTypes: [],
                techLevel: undefined,
                categories: [category],
              } as UserPreferences,
            }
          );
          const tools = error ? [] : ((data as AITool[]) ?? []);
          return { label, icon, tools: tools.slice(0, 6) };
        })
      );
      this.guestSections.set(sections);
    } catch {
      this.errorMsg.set('No se pudieron cargar las recomendaciones.');
    } finally {
      this.guestLoading.set(false);
    }
  }

  private async loadOccupations() {
    const pageSize = 1000;
    let from = 0;
    let all: Occupation[] = [];

    while (true) {
      const { data } = await this.supabaseService.client
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
    const userId = this.authService.user()?.id;
    if (userId) {
      await this.preferencesService.savePreferences(userId, this.preferences());
    }
    await this.getRecommendations();
  }

  private async getRecommendations() {
    this.isLoading.set(true);
    this.errorMsg.set(null);
    try {
      const { data, error } = await this.supabaseService.client.functions.invoke(
        'recommend-tools',
        { body: this.preferences() }
      );
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

  async clearPrefs() {
    const userId = this.authService.user()?.id;
    if (userId) {
      await this.preferencesService.clearPreferences(userId);
    }
    this.resetWizardState();
  }

  hideImage(event: Event) {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
