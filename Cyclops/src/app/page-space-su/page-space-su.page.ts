import { Component, OnInit } from '@angular/core';
import { ModalController, PopoverController } from '@ionic/angular';
import { EcoPopoverComponent } from './eco-popover/eco-popover.component';
import { ScoreModalComponent } from './score-modal/score-modal.component';
import { NavController } from '@ionic/angular';
import { PageSpaceMePage } from '../page-space-me/page-space-me.page';
import { Router } from '@angular/router';
import { FirebaseService } from '../FirebaseService/firebase.service';
import { Observable, from, of } from 'rxjs'
import { filter } from 'rxjs/operators';
import { identifierModuleUrl } from '@angular/compiler';
import { convertToViews } from '@ionic/core/dist/types/components/nav/view-controller';
import { solutionItem, sectionList, ecoData } from '../sharedData/ecoData';

@Component({
  selector: 'app-page-space-su',
  templateUrl: './page-space-su.page.html',
  styleUrls: ['./page-space-su.page.scss'],
})
export class PageSpaceSuPage implements OnInit {

  profile = {
    solution: "Solution", // retrives solution from score modal
    section: "Section", // retrives section from score modal
    range: 0, // retrives value from score modal
    level: 0, // retrives level from score modal
    updatedscore: 0, // retrives level*range
    rating: 0
  }

  surveyPage: PageSpaceMePage;

  solutions;
  // selectOptions;
  displaySol: fetchSolution[];
  sortType: string;//this handles the type of sorting


  constructor(
    public ecopopover: PopoverController,
    private modalCtrol: ModalController,
    public navCtrl: NavController,
    public firebaseService: FirebaseService,
    private router: Router,
  ) {
    // this.contentLoading();
    this.dummyContentLoading();
  }


  async notifications(ev: any) {
    const popover = await this.ecopopover.create({
      component: EcoPopoverComponent,
      event: ev,
      translucent: true
    });
    return await popover.present();
  }

  goSurvey() {
    this.router.navigateByUrl('tabs/page-space-me');
  }

  contentLoading() {
    this.firebaseService.getDataServiceECOPage().subscribe((res) => {
      this.solutions = res.map(e => {
        return {
          id: e.payload.doc.id,
          name: e.payload.doc.data()['name'],
          description: e.payload.doc.data()['description'],
          section: e.payload.doc.data()['section'],
          starLevel: e.payload.doc.data()['starLevel']
        }
      })

      // console.log("content loaded", this.solutions.map((a: any) => a.starLevel));
      this.displaySol = this.solutions;
      console.log("solution", this.solutions);
      this.sortTypeInitialize();
    }, (err: any) => {
      console.log(err);
    })

  }
  dummyContentLoading() {
    this.displaySol = ecoData;
    this.sortTypeInitialize();
  }

  ngOnInit() {

  }

  sortTypeInitialize() {
    this.sortType = "starUp";
  }
  openModal() {
    this.modalCtrol.create({
      component: ScoreModalComponent,
      componentProps: this.profile
    }).then(modalres => {
      modalres.present();

      modalres.onDidDismiss().then(res => {
        if (res.data != null) {
          this.profile = res.data;
        }
      })
    })
  }
  sortTypeOnChange() {
    // const currentTime = new Date().getTime();
    // console.log("sort type:", this.sortType, currentTime);
    //handle the event here
    //use the new sortType to update displaySol
    if (this.sortType === "starUp") {
      console.log("sort Asc")
      this.displaySol.sort((a, b) => (a.star > b.star) ? 1 : -1);
    }
    if (this.sortType === "starDown") {
      console.log("sort Des")
      this.displaySol.sort((a, b) => (a.star < b.star) ? 1 : -1);
    }
  }
}
type fetchSolution = {
  // id: string;
  name: string;
  star: number;
  detail: string;
  section: string;
}

