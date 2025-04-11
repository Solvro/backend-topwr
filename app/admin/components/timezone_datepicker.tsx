import { DatePicker } from "@adminjs/design-system";
import { BasePropertyProps, PropertyLabel } from "adminjs";
import { DateTime } from "luxon";
import { FC, useState } from "react";
import React from "react";

const TimezoneDatepicker: FC<BasePropertyProps> = (props) => {
  const { record, property, onChange } = props;
  const recordValue: string | undefined = record?.params[property.path];

  const [date, setDate] = useState<string | undefined>(recordValue);
  const propertyWithLabel = {
    ...property,
    label: property.label.substring(3),
  };
  const handleDateChange = (pickedDate: string | null) => {
    if (pickedDate !== null) {
      const localDate = DateTime.fromISO(pickedDate, { zone: "utc" })
        .setZone(DateTime.local().zoneName)
        .toISO({ includeOffset: false });
      if (localDate !== null) {
        setDate(localDate);
        if (onChange != null) {
          onChange(property.path, localDate);
        }
      }
    }
  };

  return (
    <div
      style={{
        marginBottom: "1em",
      }}
    >
      <PropertyLabel property={propertyWithLabel}></PropertyLabel>
      <DatePicker
        value={date}
        onChange={handleDateChange}
        showTimeInput={props.property.type === "datetime"}
      />
    </div>
  );
};

export default TimezoneDatepicker;
