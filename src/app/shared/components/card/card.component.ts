import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-ui-card',
  imports: [],
  template: '<ng-content />',
  styleUrl: './card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.is-interactive]': 'interactive()',
  },
})
export class CardComponent {
  readonly interactive = input(false);
}
