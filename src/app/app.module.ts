import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { HttpClientModule } from "@angular/common/http";
import { LeafletModule } from "@asymmetrik/ngx-leaflet";
import { FormsModule } from '@angular/forms';


import { AppComponent } from "./app.component";

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, HttpClientModule, LeafletModule, FormsModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
