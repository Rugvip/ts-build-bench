import React, { FC } from 'react';
import { Button } from '@material-ui/core';

type Props = {
  a: string;
  b: number;
  c: { [key in string]: number };
};

export const Component: FC<Props> = ({ a, b, c }) => {
  return (
    <Button style={{ width: b }} {...c}>
      {a}
    </Button>
  );
};
