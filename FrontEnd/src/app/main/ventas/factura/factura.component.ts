import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { Observable, Subject } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { FacturasService } from '../facturas/facturas.service';
import { facturaDetalle, facturaEncabezado, Order, pago, tarjeta, efectivo, cheque, transferencia } from '../interfaces/interfaces';
import { format } from 'date-fns';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-factura',
  templateUrl: './factura.component.html',
  styleUrls: ['./factura.component.scss'],
  encapsulation: ViewEncapsulation.None, 
  animations   : fuseAnimations
})
export class FacturaComponent implements OnInit {
  displayedColumns = ['Line', 'ItemCode', 'ItemName', 'Price', 'Cantidad', 'Descuento', 'Total', 'Bodega', 'actions'];
  ELEMENT_DATA: Element[] = [];
  ELEMENT_VALIDADOR: valida[] = [];
  formap: validapago[] = [];
//   dataSource = new MatTableDataSource(this.ELEMENT_DATA);
  dataSource = new MatTableDataSource<Element>(this.ELEMENT_DATA);
  FacturaE: facturaEncabezado = {};
  FacturaD: facturaDetalle = {};
  selectedSerie: boolean;
  validaciones= false; 
  Ftupdate= true;
  codlista: any;
  docum: any =
      {
          DocNum: ''   
    };
    selectBod: any;
  FacturaForm: FormGroup;
  pageType: any;
  typeDocum: any;
  series: any;
  selectSerie: any;
  selecSerieS: any;
  productosCtrl = new FormControl();
  socioCtrl = new FormControl();
  filteredSocios: Observable < any[] > ;
  filteredProducts: Observable < any[] > ; 
  productItem: any;
  socioItem: any;

  socios: any;
  //   socios: any[] = [{
//       csocio: null,
//       nombre: null
//   }];
bodegas: any;
//   products: any[] = [{
//       ItemCode: null,
//       ItemName: null
//   }];
products: any;
  Detalle: any;
  statusForm: FormGroup;
  EfectivoForm: FormGroup;
  TarjetaForm: FormGroup;
  ChequeForm: FormGroup;
  TransForm: FormGroup;
  tipoPagos: any;
  order: Order;
  selectTypePago: any="";
  private _unsubscribeAll: Subject < any > ;
totalpago= 0;
saldoVencido= 0;
pago: pago = {};
tarjeta: tarjeta = {};
efectivo: efectivo = {};
cheque: cheque = {};
transferencia: transferencia = {};
numpago: number;
payment: any;
totapagado= 0;
saldo= 0;
PermisoEPago:any;
  constructor(private facturaService: FacturasService,
              private activatedRoute: ActivatedRoute,
              private _formBuilder: FormBuilder,
              private _matSnackBar: MatSnackBar,
              private router: Router) {
           
                this.order = new Order();
      // Set the private defaults
                this._unsubscribeAll = new Subject();

                this.FacturaForm = this.createcotizacionForm();
                this.facturaService.getAll('/socios').subscribe(
          (res) => {
                this.socios=res;
            //   this.socios[0] = res[0];
            //   this.socios[1] = res[1];
              this.filteredSocios = this.socioCtrl.valueChanges
                  .pipe(
                      startWith(''),
                      map(state => state ? this._filterSocios(state) : this.socios.slice())
                  );
          }
      );

                this.facturaService.getAll('/products').subscribe(
          (res) => {
              this.products = res;
            //   this.products[0] = res[0];
            //   this.products[1] = res[1];
              this.filteredProducts = this.productosCtrl.valueChanges
                  .pipe(
                      startWith(''),
                      map(state => state ? this._filterProducts(state) : this.products.slice())
                  );
          }
      );
  }

  refreshTable() {
      this.dataSource = new MatTableDataSource(this.ELEMENT_DATA);
  }

  ngOnInit(): void {

      const params = this.activatedRoute.snapshot.params;
      this.pageType = params.id;
      this.typeDocum = params.tipo;

      if (params.id == 'new') {
        this.FacturaE.fechaDoc=new Date();
        this.FacturaForm.get("fechaDoc").setValue(this.FacturaE.fechaDoc);
      this.getNumerion();
      this.getbodegas();
      this.PermisoEliminarPago();
      this.Ftupdate = true;
      } else
      if (params.id) {
        this.Ftupdate = false;
        this.getNumerion();
        this.getbodegas();
        this.getFormapagos();
        this.PermisoEliminarPago();
        let buscarE;
        let buscarD;
        if (params.tipo == 'factura'){
            buscarE = '/factura/Encabezado';
            buscarD = '/factura/Detalle';
          }
        if (params.tipo == 'pedido'){
            buscarE = '/pedido/EncabezadoB';
            buscarD = '/pedido/Detalle';
            this.Ftupdate = true;
          }
        if (params.tipo == 'cotizacion'){
           // buscarE = '/cotizacion/EncabezadoB';
            buscarE = '/cotizacion/Encabezado'; // antes de tocarlo
            buscarD = '/cotizacion/Detalle';
            this.Ftupdate = true;
          }
        this.facturaService.getOne(buscarE, params.id).subscribe(
              (res) => {
            
                  this.FacturaE = res[0];
            
                  if (params.tipo != 'factura'){
                    this.FacturaE.BaseDocRef=res[0]['tipo'];
                    this.FacturaE.BaseRef=res[0]['numero'];
                      this.FacturaE.numero ='';
                  }
                  // this.series.cnum=res["Serie"];
                  this.FacturaForm = this.createcotizacionForm();
              }
          );
        this.facturaService.getOne(buscarD, params.id).subscribe(
            (res: any[]) => {
  
                for (let index = 0; index < res.length; index++){
                    this.ELEMENT_DATA.push({
                        DocNum: params.id,
                        Linea: res[index]['Linea'],
                        itemCode: res[index]['itemCode'],
                        itemName: res[index]['itemName'],
                        precio: res[index]['precio'],
                        cantidad: res[index]['cantidad'],
                        DescuentoLine: res[index]['DescuentoLine'],
                        totaLine: res[index]['totaLine'],
                        almacen: res[index]['almacen'],
                        impuestocod: 0,
                        tipo:res[index]['tipo'],
                    });
                }
                this.selectedSerie = true;
                this.validaciones = true;
                this.refreshTable();
                this.totalGeneral();
              }
          );
      }
      
      this.statusForm = this._formBuilder.group({
        pagotipo: ['']
    });
      this.EfectivoForm = this._formBuilder.group({
        efectivo: [0],
        nombreBancoE: [''],
    });

      this.TarjetaForm = this._formBuilder.group({
        tarjetaNumber: ['', Validators.required],
        FechaV: ['', Validators.required],
        Nombre: ['', Validators.required],
        identidad: ['', Validators.required],
        totalTarjeta: [0, Validators.required],
        nombreBancoT: [''],
    });

      this.ChequeForm = this._formBuilder.group({
        nombreBanco: ['', Validators.required],
        fechaCheque: ['', Validators.required],
        numeroCheque: ['', Validators.required],
        totalCheque: [0, Validators.required],
    });

      this.TransForm = this._formBuilder.group({
        numeroTrans: ['', Validators.required],
        FechaTrans: ['', Validators.required],
        nombreBancoTT: [''],
        totalTrans: [0, Validators.required],
        
    });
   }
getFormapagos(){
    this.facturaService.getAll('/formapagos').subscribe(
        (res) => {
         //   this.FacturaE.DocNum=res[0]['Correlativo'];
           this.tipoPagos = res; 
        }
    );

}
   getNumerion(){
    
    const user = JSON.parse(localStorage.getItem('usuario'));
    this.facturaService.getnumeracion('/factura/correlativo', user.company, 'Factura').subscribe(
        (res) => {
         //   this.FacturaE.DocNum=res[0]['Correlativo'];
           this.series = res; 

        }
    );
   }

    
   numerosuc(event){

    const user = JSON.parse(localStorage.getItem('usuario'));
    this.facturaService.getOnenumeracion('/factura/correlativoOne', user.company, 'Factura', event).subscribe(
        (res1) => {
            this.selectSerie = res1;
 
            this.facturaService.getformato('/factura/formato', res1[0]['correlativo']).subscribe(
                (res) => {
this.selecSerieS = true;
this.FacturaE.DocNum = res1[0]['correlativo'];
this.FacturaE.numero = res1[0]['prefijo'] + res[0]['Numero'];
for (let index = 0; index < this.ELEMENT_DATA.length; index++){
                        this.ELEMENT_DATA[index]['DocNum'] = this.FacturaE.numero;
                        }
                }
            );
        //   this.series=res; 
        }
       
    );
    this.selectedSerie = true;
   }
  complete(event) {
      this.facturaService.getOneSocio('/socios/edit', event.target.value).subscribe(
          (res) => {
              this.FacturaE.SocioCode = event.target.value;
              this.FacturaE.NombreSocio = res[0]['nombre'];
              this.FacturaE.RTN = res[0]['rtn'];
              this.FacturaE.Direccion = res[0]['direccion'];
              this.FacturaE.comentarios = res[0]['observaciones'];
             
              this.FacturaE.SocioCode = event.target.value;
              this.FacturaE.NombreSocio = res[0]['nombre'];
              this.FacturaE.RTN = res[0]['rtn'];
              this.FacturaE.Direccion = res[0]['direccion'];
              this.FacturaE.comentarios = res[0]['observaciones'];
              this.codlista = res[0]['codlista'];
              this.FacturaForm.get('NombreSocio').setValue(this.FacturaE.NombreSocio);
              this.FacturaForm.get('RTN').setValue(this.FacturaE.RTN);
              this.FacturaForm.get('direccion').setValue(this.FacturaE.Direccion);
              this.FacturaForm.get('comentario').setValue(this.FacturaE.comentarios);
          },
          (err) => {
              console.log(err);
          }
      );
  }
  Change(event) {
  
      const indice: number = this.ELEMENT_DATA.indexOf(event);
      this.ELEMENT_DATA[indice]['totaLine'] = this.total(event['cantidad'], event['precio'], event['DescuentoLine']);
      this.validarExist(event);
      this.refreshTable();
  }

  total(cant: number, precio: number, descuento: number): number {
      return (cant * precio) - (cant * precio) * (descuento / 100);
  }

  totalGeneral(): number{
    let valor = 0;
    for (let index = 0; index < this.ELEMENT_DATA.length; index++){
    valor += this.ELEMENT_DATA[index]['totaLine'];
    }
    return valor;
  }

  isv(): number{
  let valor = 0;
  for (let index = 0; index < this.ELEMENT_DATA.length; index++){
  valor += this.ELEMENT_DATA[index]['totaLine'];
  }
  return valor * 0.15;
}
  grandTotal(): number{
  let valor = 0;
  valor = this.totalGeneral() + this.isv();
  return valor; 
}
  completeProducts(event) {
    if (this.Ftupdate == true){
        if ( !this.codlista) {
            this._matSnackBar.open('Debe de seleccionar un cliente', 'OK', {
                verticalPosition: 'top',
                duration: 2000
            });
            this.validaciones = false;
        }else{
            this.validaciones = true;
            this.facturaService.getInfo('/products/info', event.target.value, this.codlista).subscribe(
          (res) => {

              this.Detalle = res[0];
              const index = this.ELEMENT_DATA.length + 1;
              this.ELEMENT_DATA.push({
                  DocNum: this.FacturaE.numero,
                Linea: index,
                itemCode: this.Detalle.ItemCode,
                itemName: this.Detalle.ItemName,
                precio: Number(((this.Detalle.price)/1.15).toFixed(2)),
                cantidad: 1,
                DescuentoLine: 0,
                totaLine: Number(((this.total(1, this.Detalle.price, 0))/1.15).toFixed(2)),
                almacen: 0,
                impuestocod: 0,
                tipo:this.Detalle.tipo,
              });      
           
              this.productItem = null;
              this.refreshTable();
          },
          (err) => {
              console.log(err);
          }
      );
        }

    }
  }
  Agregar(event){
      if (this.Ftupdate == true){
        if ( !this.codlista) {
            this._matSnackBar.open('Debe de seleccionar un cliente', 'OK', {
                verticalPosition: 'top',
                duration: 2000
            });
            this.validaciones = false;
        }else{
            this.validaciones = true;
            this.facturaService.getInfo('/products/info', this.productItem, this.codlista).subscribe(
        (res) => {
      
           this.Detalle = res[0];
           const index = this.ELEMENT_DATA.length + 1;
           this.ELEMENT_DATA.push({
                DocNum: this.FacturaE.numero,
                Linea: index,
                itemCode: this.Detalle.ItemCode,
                itemName: this.Detalle.ItemName,
                precio: Number(((this.Detalle.price)/1.15).toFixed(2)),
                cantidad: 1,
                DescuentoLine: 0,
                totaLine: Number(((this.total(1, this.Detalle.price, 0))/1.15).toFixed(2)),
                almacen: 0,
                impuestocod: 0,
                tipo:this.Detalle.tipo,
            });
        
           this.productItem = null;
           this.refreshTable();
        },
        (err) => {
            console.log(err);
        }
    );
    }
}
  }
getbodegas(){
    
    const user = JSON.parse(localStorage.getItem('usuario'));
    const comp = Number(user.company);
    this.facturaService.getbodegasCompany('/bodegas/bodega', comp).subscribe(
        (res) => {
this.bodegas = res;
        }
    );
}
validarExist(eve) {
   if( eve.tipo=== "I"){
    let stock = 0;
    this.facturaService.getExistencia('/products/Existencia', eve.itemCode, eve.almacen).subscribe(
        (res: any[]) => {
                if (res.length === 0){
                    this.validaciones = false;
                    this._matSnackBar.open('La bodega no esta asignada al producto seleccionado', 'OK', {
                  verticalPosition: 'top',
                  duration: 2000
              });
            }else{
            stock = res[0]['stock'];
            if (eve.cantidad > stock) {
                this._matSnackBar.open('la cantidad recae sobre inventario negativo', 'OK', {
                    verticalPosition: 'top',
                    duration: 2000
                });
                this.validaciones = false;
            } else {
                if (this.selecSerieS == true){

                    this.validaciones = true;
                }else{
                    this.validaciones = false;
                }
            }
          }
        }
    );
}
}
  actions(event) {
      const indice: number = this.ELEMENT_DATA.indexOf(event);
      this.ELEMENT_DATA.splice(indice, 1);
      for (let index = 0; index < this.ELEMENT_DATA.length; index++) {
          this.ELEMENT_DATA[index]['Linea'] = index + 1;
      }
      if (this.ELEMENT_DATA.length === 0){
        this.validaciones = false;
    }
      this.refreshTable();
  }

  private _filterSocios(value: string): any[] {
      const filterValue = value.toLowerCase();
      return this.socios.filter(option => option.nombre.toLowerCase().includes(filterValue));
  }

  private _filterProducts(value: string): any[] {
      const filterValue = value.toLowerCase();
      return this.products.filter(option => option.ItemName.toLowerCase().includes(filterValue));
  }

  save() {
    this.FacturaE.SocioCode =  this.FacturaForm.get('SocioCode').value;
    this.FacturaE.NombreSocio =  this.FacturaForm.get('NombreSocio').value;
    this.FacturaE.Moneda = 'LPS';
    this.FacturaE.TotalDoc = this.grandTotal();
    this.FacturaE.impuesto = this.isv();
    let user=JSON.parse(localStorage.getItem('usuario'));
    this.FacturaE.UserCreate = user.usuario ;
    this.FacturaE.comentarios = '';
    this.FacturaE.tasa = 0;
    this.FacturaE.vendedor = 1;

    this.FacturaE.DescPorcentaje = 0;
    this.FacturaE.fechaDoc = this.FacturaForm.get('fechaDoc').value;

    
    this.FacturaE.LastUpdate = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    // this.FacturaE.fechaDoc=  format(new Date(this.FacturaE.fechaDoc), "yyyy-MM-dd HH:mm:ss");
    this.docum.DocNum = this.FacturaE.DocNum;
    this.FacturaE.tipo = 'FACTURA';
    this.FacturaE.Serie = this.selectSerie[0]['cnum'];

    this.FacturaE.ccomp = this.selectSerie[0]['ccomp']; 
    this.FacturaE.cai = this.selectSerie[0]['cai']; 
    this.FacturaE.fact_emini = this.selectSerie[0]['fact_emini']; 
    this.FacturaE.fact_emifin = this.selectSerie[0]['fact_emifin']; 
    this.FacturaE.correo = this.selectSerie[0]['correo']; 
    this.FacturaE.fecha_limite = format(new Date(this.selectSerie[0]['fecha_limite']), 'yyyy-MM-dd HH:mm:ss');
    this.FacturaE.RTN = this.FacturaForm.get('RTN').value;
    this.FacturaE.Direccion = this.FacturaForm.get('direccion').value;
    this.FacturaE.comentarios = this.FacturaForm.get('comentario').value;
    const cnum = this.selectSerie[0]['cnum'];
    this.FacturaE.status='A';
    delete this.FacturaE.DocNum;

    this.guardarValidaciones('Lasagna', (valida: valida[]) => {

     
        const validaciones = valida.find(valor => valor.Stock === 'false' ||  valor.Stock === 'BODEGA');

        ///////////////////// grabar en tabla//////////////////////////////////
        if (!validaciones) {
            console.log('fencabezado',this.FacturaE)
            this.facturaService.addfacturaEncabezado(this.FacturaE).then(respuesta => {

                    for (let index = 0; index < this.ELEMENT_DATA.length; index++) {

                        this.facturaService.addfacturaDetalle(this.ELEMENT_DATA[index]);
                        // tslint:disable-next-line: max-line-length
                        if (this.ELEMENT_DATA[index]['tipo']==='I'){
                            this.facturaService.setExistencia('/products/setExistencia', this.ELEMENT_DATA[index]['itemCode'], this.ELEMENT_DATA[index]['almacen'], this.ELEMENT_DATA[index]['cantidad']);

                        }else{
                            this.facturaService.ExcExistencia('/products/ExecExistencia', this.ELEMENT_DATA[index]['itemCode'], this.ELEMENT_DATA[index]['almacen'],this.ELEMENT_DATA[index]['tipo']).subscribe(
                                (res: any[])=>{
                                    for (let ind = 0; ind < res.length; ind++) {
                                   //     console.log( res[ind]['ItemCode'], res[ind]['cbod'], res[ind]['candpromo']*this.ELEMENT_DATA[index]['cantidad'])
                                        this.facturaService.setExistencia('/products/setExistencia', res[ind]['ItemCode'], res[ind]['cbod'], res[ind]['candpromo']*this.ELEMENT_DATA[index]['cantidad']);
                                    }
                                })

                        }

   
                       



                        if (this.typeDocum === 'pedido'){
                        // tslint:disable-next-line: max-line-length
                        this.facturaService.setExistencia('/products/setComprometido', this.ELEMENT_DATA[index]['itemCode'], this.ELEMENT_DATA[index]['almacen'], this.ELEMENT_DATA[index]['cantidad']);
                    
                       }
                    }
                 
                    if (this.typeDocum === 'pedido'){
                     this.facturaService.updatestatus(this.pageType, 'C');
                    }
                    if (this.typeDocum === 'cotizacion'){
                        this.facturaService.updatestatusC(this.pageType, 'C');
                       }
                    this.facturaService.updateCorrelativo(cnum);

                })
                .then(resp => {
                    this._matSnackBar.open('Factura Agregada!', 'OK', {
                        verticalPosition: 'top',
                        duration: 2000
                    });

                    // Change the location with new one

                    this.router.navigate(['ventas/facturas']);
                });
        } else {
            this._matSnackBar.open('Uno de los productos recae en inventario negativo o no existe en bodega!', 'OK', {
                verticalPosition: 'top',
                duration: 2000
            });


        }

        ///////////////////// FIN grabar en tabla//////////////////////////////////     


    });
}

//   search = (key, inputArray) => {
//       console.log("inputArray",inputArray,key)
//     for (let i=0; i < inputArray.length; i++) {
//         if (inputArray[i].itemCode === key) {
//             return inputArray[i];
//         }
//     }
// }}
guardarValidaciones = (meal, callback) => {

    let stock = 0;

    let contador = 0;
    this.ELEMENT_VALIDADOR = [];
    // tslint:disable-next-line: prefer-for-of
    for (let index = 0; index < this.ELEMENT_DATA.length; index++) {


        this.facturaService.ExcExistencia('/products/ExecExistencia', this.ELEMENT_DATA[index]['itemCode'], this.ELEMENT_DATA[index]['almacen'],this.ELEMENT_DATA[index]['tipo']).subscribe(
            (res: any[]) => {

                if (this.ELEMENT_DATA[index]['tipo']==='I'){
                if (res.length === 0){
                    const line = this.ELEMENT_VALIDADOR.length + 1;
                    this.ELEMENT_VALIDADOR.push({
                        Linea: line,
                        itemCode: this.ELEMENT_DATA[index]['itemCode'].toString(),
                        itemName: this.ELEMENT_DATA[index]['itemName'].toString(),
                        Stock: 'BODEGA'
                    }, );
                
                }else{
                

                stock = res[0]['stock'];


                if (this.ELEMENT_DATA[index]['cantidad'] > stock) {
                    const line = this.ELEMENT_VALIDADOR.length + 1;
                    this.ELEMENT_VALIDADOR.push({
                        Linea: line,
                        itemCode: this.ELEMENT_DATA[index]['itemCode'].toString(),
                        itemName: this.ELEMENT_DATA[index]['itemName'].toString(),
                        Stock: 'false'
                    }, );
                } else {
                    const line = this.ELEMENT_VALIDADOR.length + 1;
                    this.ELEMENT_VALIDADOR.push({
                        Linea: line,
                        itemCode: this.ELEMENT_DATA[index]['itemCode'].toString(),
                        itemName: this.ELEMENT_DATA[index]['itemName'].toString(),
                        Stock: 'true'
                    });
                }
            }


        }else{

            if (res.length === 0){
                const line = this.ELEMENT_VALIDADOR.length + 1;
                this.ELEMENT_VALIDADOR.push({
                    Linea: line,
                    itemCode: this.ELEMENT_DATA[index]['itemCode'].toString(),
                    itemName: this.ELEMENT_DATA[index]['itemName'].toString(),
                    Stock: 'BODEGA'
                }, );
            
            }else{
                for (let ind = 0; ind < res.length; ind++) {
          
            stock = res[ind]['stock'];


            if (this.ELEMENT_DATA[index]['cantidad']*res[ind]['candpromo'] > stock) {
                const line = this.ELEMENT_VALIDADOR.length + 1;
                this.ELEMENT_VALIDADOR.push({
                    Linea: line,
                    itemCode: res[ind]['ItemCode'],
                    itemName: res[ind]['ItemName'],
                    Stock: 'false'
                });
            } else {
                const line = this.ELEMENT_VALIDADOR.length + 1;
                this.ELEMENT_VALIDADOR.push({
                    Linea: line,
                    itemCode: res[ind]['ItemCode'],
                    itemName: res[ind]['ItemName'],
                    Stock: 'true'
                });
            }
        }
    }

        }









                contador = contador + 1;

                if (contador === this.ELEMENT_DATA.length) {
                    callback(this.ELEMENT_VALIDADOR);
                }

            });

    }



}

update() {
    this.FacturaE.TotalDoc = this.grandTotal();
    this.FacturaE.impuesto = this.isv();
    this.FacturaE.LastUpdate = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    this.FacturaE.fechaDoc = this.FacturaForm.get('fechaDoc').value;
    // this.FacturaE.fechaDoc=   format(new Date(this.FacturaE.fechaDoc), "yyyy-MM-dd HH:mm:ss");
    this.FacturaE.tipo = 'FACTURA';
    this.docum.DocNum = this.FacturaE.numero;

    this.FacturaE.fecha_limite = format(new Date(this.FacturaE.fecha_limite), 'yyyy-MM-dd HH:mm:ss');
    this.FacturaE.RTN = this.FacturaForm.get('RTN').value;
    this.FacturaE.Direccion = this.FacturaForm.get('direccion').value;
    this.FacturaE.comentarios = this.FacturaForm.get('comentario').value;



    this.facturaService.updatefacturaEncabezado(this.FacturaE).then(respuesta => {


        })
        .then(resp => {
            this._matSnackBar.open('Factura Modificada!', 'OK', {
                verticalPosition: 'top',
                duration: 2000
            });

            // Change the location with new one

            this.router.navigate(['ventas/facturas']);
        });


}
getFormattedDate( originalDate ){
    originalDate = new Date(originalDate);
    return originalDate.toISOString().substring(0, originalDate.toISOString().length - 1);
}


VtotalPago(){
 
    this.totalpago = 0;
    this.totalpago = Number.parseFloat( this.EfectivoForm.get('efectivo').value) +
    Number.parseFloat(this.TarjetaForm.get('totalTarjeta').value) +
    Number.parseFloat(this.ChequeForm.get('totalCheque').value) +
    Number.parseFloat(this.TransForm.get('totalTrans').value);
    this.VsaldoVencido();

}
VsaldoVencido(){
    
    this.saldoVencido = this.FacturaE.TotalDoc - (this.totalpago + this.totapagado);
}
tabs(ev){
    this.totapagado = 0;
    if (ev.index === 2){
this.facturaService.getAll('/pago/numpago').subscribe(
    (res) => {
     
this.numpago = res[0]['pagoId'];
this.facturaService.getPagos('/pago/Bpago', this.FacturaE.numero).subscribe(
    (res) => {
       console.log(res)
    this.payment = res;
  
    for (let i = 0; i < this.payment.length; i++){
      
        this.totapagado += Number.parseFloat( this.payment[i]['totalPago']);
    }
    this.saldo = this.FacturaE.TotalDoc - (this.totalpago + this.totapagado);
    this.VsaldoVencido();
    }
);

    }
);

}
}


refreshpagos(){
    this.totapagado = 0;

    this.facturaService.getAll('/pago/numpago').subscribe(
        (res) => {
         
    this.numpago = res[0]['pagoId'];
  
    this.facturaService.getPagos('/pago/Bpago', this.FacturaE.numero).subscribe(
        (res) => {
        this.payment = res;
        for (let i = 0; i < this.payment.length; i++){
            this.totapagado += this.payment[i]['totalPago'];
        }
        this.saldo = this.FacturaE.TotalDoc - (this.totalpago + this.totapagado);
        this.VsaldoVencido();
        }
    );
        }
    );
     
}
guardarpago(){

    this.facturaService.getAll('/pago/numpago').subscribe(
        (res) => {
         
    this.numpago = res[0]['pagoId'];

       this.pago.status='A';
    this.pago.pagoId = this.numpago;
    this.pago.fechaPago = new Date();
    this.pago.tipoDocumento ='FACTURA'
    this.pago.NDocumento = this.FacturaE.numero;
    this.pago.totalPago = this.totalpago;
    this.pago.formaPago=this.selectTypePago;

    this.efectivo.pagoId = this.numpago;
    this.efectivo.totalEfectivo = Number.parseFloat( this.EfectivoForm.get('efectivo').value);
    this.efectivo.nombreBancoE = this.EfectivoForm.get('nombreBancoE').value;

    this.tarjeta.pagoId = this.numpago;
    this.tarjeta.tarjetaNumber = this.TarjetaForm.get('tarjetaNumber').value;
    this.tarjeta.FechaV = this.TarjetaForm.get('FechaV').value;
    this.tarjeta.Nombre = this.TarjetaForm.get('Nombre').value;
    this.tarjeta.identidad = this.TarjetaForm.get('identidad').value;
    this.tarjeta.totalTarjeta = Number.parseFloat(this.TarjetaForm.get('totalTarjeta').value);
    this.tarjeta.nombreBancoT = this.TarjetaForm.get('nombreBancoT').value;

    this.cheque.pagoId = this.numpago;
    this.cheque.fecha = this.ChequeForm.get('fechaCheque').value;
    this.cheque.nombreBanco = this.ChequeForm.get('nombreBanco').value;
    this.cheque.numeroCheque = this.ChequeForm.get('numeroCheque').value;
    this.cheque.totalCheque = Number.parseFloat(this.ChequeForm.get('totalCheque').value);

 
    this.transferencia.pagoId = this.numpago;
    this.transferencia.NumeroTrans = this.TransForm.get('numeroTrans').value;
    this.transferencia.fecha = this.TransForm.get('FechaTrans').value;

    this.transferencia.totaltrans = Number.parseFloat(this.TransForm.get('totalTrans').value);

    this.transferencia.nombreBancoTT = this.TransForm.get('nombreBancoTT').value;

    let pagoefectivo= false;
    let valefectivo= false;
    let pagotarjeta= false;
    let valtarjeta= false;
    let pagocheque= false;
    let valcheque= false;
    let pagotrans= false;
    let valtrans= false;
    let valgeneral= true;

    if ( Number.parseFloat( this.EfectivoForm.get('efectivo').value) > 0
|| Number.parseFloat(this.TarjetaForm.get('totalTarjeta').value) > 0
|| Number.parseFloat(this.ChequeForm.get('totalCheque').value) > 0
|| Number.parseFloat(this.TransForm.get('totalTrans').value) > 0){


        if ( Number.parseFloat( this.EfectivoForm.get('efectivo').value) > 0){
            pagoefectivo = true;
            valefectivo = true;
            
        }else if (Number.parseFloat( this.EfectivoForm.get('efectivo').value) < 0){
     valefectivo = false;
        }
    
        if (Number.parseFloat(this.TarjetaForm.get('totalTarjeta').value) > 0){
          pagotarjeta = true;
          if (!this.TarjetaForm.invalid){
                valtarjeta = true;
            }
        }     
        
            
        if (Number.parseFloat(this.ChequeForm.get('totalCheque').value) > 0){
            pagocheque = true;
            if (!this.ChequeForm.invalid){
                  valcheque = true;
              }
          }  

        if (Number.parseFloat(this.TransForm.get('totalTrans').value) > 0){
            pagotrans = true;
            if (!this.TransForm.invalid){
                  valtrans = true;
              }
          }  

        if (pagoefectivo && !valefectivo){
            valgeneral = false;
          }
        if (pagotarjeta && !valtarjeta){
            valgeneral = false;
          }
        if (pagocheque && !valcheque)
        {
            valgeneral = false;
        }
        if (pagotrans && ! valtrans){
            valgeneral = false;
        }

        if (valgeneral === true){

            
        this.facturaService.addpago(this.pago);
        if (valefectivo === true){
    this.facturaService.addDetallepago('/pago/efectivo', this.efectivo);
}
        if (valtarjeta === true){
    this.facturaService.addDetallepago('/pago/tarjeta', this.tarjeta);
}
        if (valcheque === true){
    this.facturaService.addDetallepago('/pago/cheque', this.cheque);
}
        if (valtrans === true){
    this.facturaService.addDetallepago('/pago/transferencia', this.transferencia);
}
        this.totalpago = 0;
        this.EfectivoForm.reset();
        this.TarjetaForm.reset();
        this.ChequeForm.reset();
        this.TransForm.reset();
        this.statusForm.reset();
        this.EfectivoForm.get('efectivo').setValue(0);
        this.TarjetaForm.get('totalTarjeta').setValue(0);
        this.ChequeForm.get('totalCheque').setValue(0);
        this.TransForm.get('totalTrans').setValue(0);
        this.selectTypePago = '';
        this.refreshpagos();

}else{
    this._matSnackBar.open('error al aplicar el pago!' , 'OK', {
        verticalPosition: 'top',
        duration: 2000
    });   
    
}
}



});


}
updateStatus(): void
{
    // const newStatusId = Number.parseInt(this.statusForm.get('pagotipo').value);
   this. selectTypePago = this.statusForm.get('pagotipo').value;
   this.VtotalPago();
//    this.VsaldoVencido();
    // if ( !newStatusId )
    // {
    //     return;
    // }

    //  const newStatus = this.tipoPagos.find((status) => {
    //     return status.id === newStatusId;
    // });

    // newStatus['date'] = new Date().toString();

    // this.order.status.unshift(newStatus);
}

EliminarPago(eve){
console.log(eve)
this.facturaService.Deletepago(eve).subscribe((res)=>{

    
 

    this._matSnackBar.open('Pago Eliminado!' , 'OK', {
        verticalPosition: 'top',
        duration: 2000
    });   

    this.router.navigate(['ventas/facturas/']);
});

}

PermisoEliminarPago(){
    this.facturaService.permisoEliminarPago().then(res=>
        {
            console.log('permiso',res)
            if(res[0]['permiso']==='Y'){
            this.PermisoEPago=true;
            }
            else{
                this.PermisoEPago=false;  
            }
        
        });
}

createcotizacionForm(): FormGroup {
    return this._formBuilder.group({
        SocioCode: [this.FacturaE.SocioCode, Validators.required],
        NombreSocio: [this.FacturaE.NombreSocio, Validators.required],
        fechaDoc: [this.FacturaE.fechaDoc, Validators.required],
        serie: [this.FacturaE.Serie, Validators.required],
        RTN: [this.FacturaE.RTN],
       comentario: [this.FacturaE.comentarios],
         direccion: [this.FacturaE.Direccion]
    });
}
}

export interface Element {
    DocNum: string; Linea: number; itemCode: string; itemName: string; precio: number; cantidad: number; DescuentoLine: number; totaLine: number; almacen: number; impuestocod: number; tipo: string;
}
export interface valida {
    Linea: number;
    itemCode: string;
    itemName: string;
    Stock: string;
}
export interface status {
 DocNum: number;
 status: string;
}

export interface validapago {
    tipo: string; activo: string;ejecutar: string;
   }
