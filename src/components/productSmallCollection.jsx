import { getOverrideProps, useDataStoreBinding } from "@aws-amplify/ui-react/internal";
import { Collection } from "@aws-amplify/ui-react";

import { Product } from "../models";
import ProductSmall from "./productSmall";

export default function ProductSmallCollection(props) {
  const { items: itemsProp, overrideItems, overrides, ...rest } = props;
  const itemsDataStore = useDataStoreBinding({
    type: "collection",
    model: Product,
  }).items;
  const items = itemsProp !== undefined ? itemsProp : itemsDataStore;
  return (
    <Collection
      type="list"
      isPaginated={true}
      searchPlaceholder="Search..."
      itemsPerPage={10}
      direction="row"
      alignItems="stretch"
      justifyContent="center"
      items={items || []}
      {...rest}
      {...getOverrideProps(overrides, "ProductSmallCollection")}
    >
      {(item, index) => (
        <ProductSmall
          product={item}
          key={item.id}
          {...(overrideItems && overrideItems({ item, index }))}
        ></ProductSmall>
      )}
    </Collection>
  );
}