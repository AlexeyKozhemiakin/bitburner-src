<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [bitburner](./bitburner.md) &gt; [WarehouseAPI](./bitburner.warehouseapi.md) &gt; [setSmartSupplyOption](./bitburner.warehouseapi.setsmartsupplyoption.md)

## WarehouseAPI.setSmartSupplyOption() method

Set whether smart supply uses leftovers before buying

**Signature:**

```typescript
setSmartSupplyOption(
    divisionName: string,
    city: CityName | `${CityName}`,
    materialName: string,
    option: string,
  ): void;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  divisionName | string | Name of the division |
|  city | [CityName](./bitburner.cityname.md) \| \`${[CityName](./bitburner.cityname.md)<!-- -->}\` | Name of the city |
|  materialName | string | Name of the material |
|  option | string | smart supply option, "leftovers" to use leftovers, "imports" to use only imported materials, "none" to not use materials from store |

**Returns:**

void

