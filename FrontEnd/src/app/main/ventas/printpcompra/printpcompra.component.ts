import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { AnonymousSubject } from 'rxjs/internal/Subject';
import {PrintPCompraService} from '../print-pcompra.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-printpcompra',
  templateUrl: './printpcompra.component.html',
  styleUrls: ['./printpcompra.component.scss'],
  encapsulation: ViewEncapsulation.None

})
export class PrintpcompraComponent implements OnInit {
  Encabezado:any={
    TotalDoc:0
  };
  Detalle:any;
  doc:any={ 
DocNum:''
  }
  pageType:any; 
  constructor(private prtservice: PrintPCompraService,
              private activatedRoute: ActivatedRoute,
              ) { 
    const params = this.activatedRoute.snapshot.params;
    this.pageType = params.id;
this.doc.DocNum=this.pageType;
console.log(this.pageType)
    this.prtservice.getCompra('/pcompra/Encabezado',this.doc).then(
      res=>{
        this.Encabezado=res[0];
        console.log('detalle',this.Encabezado)
      }
    );
    this.prtservice.getDetalle('/pcompra/Detalle',this.doc.DocNum).subscribe(
      (res)=>{
        this.Detalle=res;
    
      },
      (err)=>{console.log(err);}
    );
    

 

  }

  ngOnInit(): void {



  }

}
