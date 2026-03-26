/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'mifosx-bureau-readiness',
  templateUrl: './bureau-readiness.component.html',
  styleUrls: ['./bureau-readiness.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class BureauReadinessComponent implements OnInit {
  @Input() clientId: number;

  kycScore: number = 65;
  isReady: boolean = false;
  missingFields: string[] = [];

  ngOnInit(): void {
    this.isReady = this.kycScore >= 70;
    this.missingFields = ['National ID (RFC)'];
  }
}
