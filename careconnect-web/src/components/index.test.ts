import { test, expect } from '@jest/globals';
import * as library from './index';
import Banner from './Banner';
import BigActionTile from './BigActionTile';
import Button from './Button';
import Card from './Card';
import ConfirmDialog from './ConfirmDialog';
import Field from './Field';

test('the barrel re-exports every library component under its name', () => {
  expect(library).toEqual({ Banner, BigActionTile, Button, Card, ConfirmDialog, Field });
});
