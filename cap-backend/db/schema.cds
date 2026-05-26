namespace deltux.pos;

@cds.persistence.exists
entity categories {
  key id : UUID;
  name : String;
  color : String;
  icon : String;
  created_at : Timestamp;
  products : Association to many products on products.category_id = $self.id;
}

@cds.persistence.exists
entity suppliers {
  key id : UUID;
  name : String;
  contact_name : String;
  email : String;
  phone : String;
  address : String;
  notes : String;
  is_active : Boolean;
  created_at : Timestamp;
  products : Association to many products on products.supplier_id = $self.id;
}

@cds.persistence.exists
entity products {
  key id : UUID;
  name : String;
  description : String;
  price : Integer;
  category_id : UUID;
  category : Association to categories on category.id = $self.category_id;
  supplier_id : UUID;
  supplier : Association to suppliers on supplier.id = $self.supplier_id;
  sku : String;
  stock : Integer;
  low_stock_threshold : Integer;
  image_url : String;
  is_active : Boolean;
  created_at : Timestamp;
}
