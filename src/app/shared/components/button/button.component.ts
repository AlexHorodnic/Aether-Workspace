import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-ui-button',
  imports: [],
  template: '<ng-content />',
  styleUrl: './button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.secondary]': 'variant() === "secondary"',
    '[class.ghost]': 'variant() === "ghost"',
    '[class.danger]': 'variant() === "danger"',
  },
})
export class ButtonComponent {
  readonly variant = input<'primary' | 'secondary' | 'ghost' | 'danger'>('primary');
}
