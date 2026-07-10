import { Component, OnDestroy, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { SupabaseService } from '../../services/supabase.service';
import { AITool } from '../../models/preferences.model';

@Component({
  selector: 'app-buscar',
  imports: [RouterLink],
  templateUrl: './buscar.html',
  styleUrl: './buscar.css',
})
export class Buscar implements OnDestroy {
  query = signal('');
  results = signal<AITool[]>([]);
  loading = signal(false);
  searched = signal(false);

  private sub: Subscription;

  constructor(
    private route: ActivatedRoute,
    private supabaseService: SupabaseService
  ) {
    this.sub = this.route.queryParamMap.subscribe(params => {
      const q = params.get('q') ?? '';
      this.query.set(q);
      this.search(q);
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  private async search(rawQuery: string) {
    const term = rawQuery.trim().replace(/[,()%]/g, ' ').trim();
    if (term.length < 2) {
      this.results.set([]);
      this.searched.set(false);
      return;
    }

    this.loading.set(true);
    this.searched.set(true);
    const { data, error } = await this.supabaseService.client
      .from('ai_tools')
      .select('*')
      .or(`tool.ilike.%${term}%,tags.ilike.%${term}%,category.ilike.%${term}%`)
      .order('upvotes', { ascending: false })
      .limit(24);

    this.results.set(error ? [] : ((data as AITool[]) ?? []));
    this.loading.set(false);
  }

  hideImage(event: Event) {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
