import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import * as React from "react";
import styled from 'styled-components'

interface DropdownProps {
  data: { id: number, label: string }[],
  initialState : number,
  callback: Function
}

export const Dropdown = observer(({data, initialState, callback}:DropdownProps) => {
  const [isOpen, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(initialState);

  const toggleDropdown = () => setOpen(!isOpen);

  const handleItemClick = (id:number) => {
    setSelectedItem(id);
    callback(id);
    toggleDropdown();
  }

  return (
    <DropdownWrapper>
      <DropdownHeader onClick={toggleDropdown}>
        {selectedItem ? data.find(item => item.id == selectedItem).label : "Select visualization"}
        <i className={`fa fa-chevron-right icon ${isOpen && "open"}`}/>
      </DropdownHeader>
      <DropdownBody className={`${isOpen && 'open'}`}>
        {data.map((item, index) =>
          <DropdownItem key={index} onClick={e => handleItemClick(item.id)} className={`${item.id == selectedItem && 'selected'}`}>
            {item.label}
          </DropdownItem>
        )}
      </DropdownBody>
    </DropdownWrapper>
  )
});

const DropdownWrapper = styled.div`
  flex-grow: 1;
  min-width: 200px;
  border-radius: 5px;
  margin-left: auto;
  margin-right: auto;
  background-color: #3996d4;
  color: white;
  font-size: 1.1rem;
  font-weight: 500;
`

const DropdownHeader = styled.div`
  padding: 15px;
  gap: 10px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const DropdownBody = styled.div`
  border-top: 1px solid #e5e8ec;
  display: none;
  
  &.open { display: block; }
`

const DropdownItem = styled.div`
  padding: 15px;

  :hover {
    cursor: pointer;
  }

  &.selected {
    background: #2b4d6e;
  }
`

const Icon = styled.div`
  font-size: 13px;
  color: #91A5BE;
  transform: rotate(0deg);
  transition: all .2s ease-in-out;

  &.open {  transform: rotate(90deg); }
`
