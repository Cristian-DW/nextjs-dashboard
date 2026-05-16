namespace deltux.pos;

using { cuid, managed } from '@sap/cds/common';

entity Categories : cuid, managed {
  name  : String not null;
  color : String default '#6366f1';
  icon  : String default 'tag';
  products : Association to many Products on products.category = $self;
}

entity Suppliers : cuid, managed {
  name         : String not null;
  contact_name : String;
  email        : String;
  phone        : String;
  address      : String;
  notes        : String;
  is_active    : Boolean default true;
  products     : Association to many Products on products.supplier = $self;
}

entity Products : cuid, managed {
  name                : String not null;
  description         : String;
  price               : Integer not null; // in cents
  category            : Association to Categories;
  supplier            : Association to Suppliers;
  sku                 : String;
  stock               : Integer default 0;
  low_stock_threshold : Integer default 5;
  image_url           : String default '/products/placeholder.png';
  is_active           : Boolean default true;
}
