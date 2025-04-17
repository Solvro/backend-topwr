import { DatePicker } from "@adminjs/design-system";
import { BasePropertyProps, PropertyLabel } from "adminjs";
import { DateTime } from "luxon";
import React, { FC, useState } from "react";

const TimezoneDatepicker: FC<BasePropertyProps> = (props) => {
  const { record, property, onChange } = props;
  const [date, setDate] = useState<string | Date | undefined>(
    record?.params[property.name] as string | Date | undefined,
  );

  const handleDateChange = (pickedDate: string | null) => {
    if (pickedDate !== null) {
      const localDate = DateTime.fromISO(pickedDate, { zone: "utc" })
        .setZone(DateTime.local().zoneName)
        .toFormat("yyyy-MM-dd");
      setDate(localDate);
      if (onChange != null) {
        onChange(property.path, localDate);
      }
    }
  };

  return (
    <div
      style={{
        marginBottom: "1em",
      }}
    >
      <PropertyLabel property={property}></PropertyLabel>
      <DatePicker
        value={date}
        onChange={handleDateChange}
        showTimeInput={false}
        propertyType={"date"}
      />
    </div>
  );
};

export default TimezoneDatepicker;
