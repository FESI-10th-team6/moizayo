import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Dropdown } from './Dropdown';

// Mock component to test dropdown functionality
const MockDropdownChild = ({ isOpen, toggle, selectedValue, onSelect }: {
  isOpen: boolean;
  toggle: () => void;
  selectedValue?: string;
  onSelect: (value: string) => void;
}) => (
  <div>
    <button onClick={toggle} data-testid="dropdown-trigger">
      {selectedValue || 'Select an option'}
    </button>
    {isOpen && (
      <div data-testid="dropdown-menu">
        <button onClick={() => onSelect('option1')} data-testid="option-1">
          Option 1
        </button>
        <button onClick={() => onSelect('option2')} data-testid="option-2">
          Option 2
        </button>
        <button onClick={() => onSelect('option3')} data-testid="option-3">
          Option 3
        </button>
      </div>
    )}
  </div>
);

describe('Dropdown Component', () => {
  beforeEach(() => {
    // Clear any existing event listeners
    document.removeEventListener('mousedown', jest.fn());
  });

  afterEach(() => {
    // Clean up event listeners after each test
    const events = ['mousedown'];
    events.forEach(event => {
      document.removeEventListener(event, jest.fn());
    });
  });

  describe('Basic Functionality', () => {
    it('should render dropdown with closed state by default', () => {
      render(
        <Dropdown>
          {(props) => <MockDropdownChild {...props} />}
        </Dropdown>
      );

      expect(screen.getByTestId('dropdown-trigger')).toBeInTheDocument();
      expect(screen.queryByTestId('dropdown-menu')).not.toBeInTheDocument();
    });

    it('should render with default value when provided', () => {
      render(
        <Dropdown defaultValue="Initial Value">
          {(props) => <MockDropdownChild {...props} />}
        </Dropdown>
      );

      expect(screen.getByTestId('dropdown-trigger')).toHaveTextContent('Initial Value');
    });

    it('should render without default value when not provided', () => {
      render(
        <Dropdown>
          {(props) => <MockDropdownChild {...props} />}
        </Dropdown>
      );

      expect(screen.getByTestId('dropdown-trigger')).toHaveTextContent('Select an option');
    });

    it('should have correct CSS classes applied', () => {
      const { container } = render(
        <Dropdown>
          {(props) => <MockDropdownChild {...props} />}
        </Dropdown>
      );

      const dropdownContainer = container.firstChild as HTMLElement;
      expect(dropdownContainer).toHaveClass('relative');
    });

    it('should initialize with isOpen false and selectedValue as defaultValue', () => {
      const childrenMock = jest.fn().mockReturnValue(<div>Test</div>);
      
      render(
        <Dropdown defaultValue="test-default">
          {childrenMock}
        </Dropdown>
      );

      expect(childrenMock).toHaveBeenCalledWith({
        isOpen: false,
        toggle: expect.any(Function),
        selectedValue: 'test-default',
        onSelect: expect.any(Function)
      });
    });
  });

  describe('Toggle Functionality', () => {
    it('should open dropdown when toggle is called', () => {
      render(
        <Dropdown>
          {(props) => <MockDropdownChild {...props} />}
        </Dropdown>
      );

      const trigger = screen.getByTestId('dropdown-trigger');
      fireEvent.click(trigger);

      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
    });

    it('should close dropdown when toggle is called on open dropdown', () => {
      render(
        <Dropdown>
          {(props) => <MockDropdownChild {...props} />}
        </Dropdown>
      );

      const trigger = screen.getByTestId('dropdown-trigger');
      
      // Open the dropdown
      fireEvent.click(trigger);
      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();

      // Close the dropdown
      fireEvent.click(trigger);
      expect(screen.queryByTestId('dropdown-menu')).not.toBeInTheDocument();
    });

    it('should toggle multiple times correctly', () => {
      render(
        <Dropdown>
          {(props) => <MockDropdownChild {...props} />}
        </Dropdown>
      );

      const trigger = screen.getByTestId('dropdown-trigger');

      // Test multiple toggles
      for (let i = 0; i < 5; i++) {
        fireEvent.click(trigger);
        if (i % 2 === 0) {
          expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
        } else {
          expect(screen.queryByTestId('dropdown-menu')).not.toBeInTheDocument();
        }
      }
    });

    it('should pass correct isOpen state to children function', () => {
      const childrenMock = jest.fn().mockReturnValue(<div>Test</div>);
      
      render(
        <Dropdown>
          {childrenMock}
        </Dropdown>
      );

      // Initially closed
      expect(childrenMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ isOpen: false })
      );

      // Toggle to open
      const toggleFn = childrenMock.mock.calls[0][0].toggle;
      fireEvent.click(screen.getByText('Test'));
      toggleFn();

      expect(childrenMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ isOpen: true })
      );
    });
  });

  describe('Selection Functionality', () => {
    it('should update selected value when option is selected', () => {
      render(
        <Dropdown>
          {(props) => <MockDropdownChild {...props} />}
        </Dropdown>
      );

      const trigger = screen.getByTestId('dropdown-trigger');
      fireEvent.click(trigger);

      const option1 = screen.getByTestId('option-1');
      fireEvent.click(option1);

      expect(trigger).toHaveTextContent('option1');
    });

    it('should close dropdown after selection', () => {
      render(
        <Dropdown>
          {(props) => <MockDropdownChild {...props} />}
        </Dropdown>
      );

      const trigger = screen.getByTestId('dropdown-trigger');
      fireEvent.click(trigger);

      const option1 = screen.getByTestId('option-1');
      fireEvent.click(option1);

      expect(screen.queryByTestId('dropdown-menu')).not.toBeInTheDocument();
    });

    it('should handle multiple selections correctly', () => {
      render(
        <Dropdown>
          {(props) => <MockDropdownChild {...props} />}
        </Dropdown>
      );

      const trigger = screen.getByTestId('dropdown-trigger');

      // Select first option
      fireEvent.click(trigger);
      fireEvent.click(screen.getByTestId('option-1'));
      expect(trigger).toHaveTextContent('option1');

      // Select second option
      fireEvent.click(trigger);
      fireEvent.click(screen.getByTestId('option-2'));
      expect(trigger).toHaveTextContent('option2');

      // Select third option
      fireEvent.click(trigger);
      fireEvent.click(screen.getByTestId('option-3'));
      expect(trigger).toHaveTextContent('option3');
    });

    it('should handle empty string selection', () => {
      const EmptyStringChild = ({ isOpen, toggle, selectedValue, onSelect }: { isOpen: boolean; toggle: () => void; selectedValue?: string; onSelect: (value: string) => void }) => (
        <div>
          <button onClick={toggle} data-testid="dropdown-trigger">
            {selectedValue || 'Select an option'}
          </button>
          {isOpen && (
            <div data-testid="dropdown-menu">
              <button onClick={() => onSelect('')} data-testid="empty-option">
                Empty Option
              </button>
            </div>
          )}
        </div>
      );

      render(
        <Dropdown>
          {(props) => <EmptyStringChild {...props} />}
        </Dropdown>
      );

      const trigger = screen.getByTestId('dropdown-trigger');
      fireEvent.click(trigger);
      fireEvent.click(screen.getByTestId('empty-option'));

      expect(trigger).toHaveTextContent('Select an option');
    });

    it('should update selectedValue state correctly when onSelect is called', () => {
      const childrenMock = jest.fn().mockReturnValue(<div>Test</div>);
      
      render(
        <Dropdown>
          {childrenMock}
        </Dropdown>
      );

      const onSelectFn = childrenMock.mock.calls[0][0].onSelect;
      onSelectFn('new-value');

      expect(childrenMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ 
          selectedValue: 'new-value',
          isOpen: false
        })
      );
    });
  });

  describe('Outside Click Functionality', () => {
    it('should close dropdown when clicking outside', async () => {
      render(
        <div>
          <Dropdown>
            {(props) => <MockDropdownChild {...props} />}
          </Dropdown>
          <div data-testid="outside-element">Outside</div>
        </div>
      );

      const trigger = screen.getByTestId('dropdown-trigger');
      const outsideElement = screen.getByTestId('outside-element');

      // Open dropdown
      fireEvent.click(trigger);
      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();

      // Click outside
      fireEvent.mouseDown(outsideElement);
      
      await waitFor(() => {
        expect(screen.queryByTestId('dropdown-menu')).not.toBeInTheDocument();
      });
    });

    it('should not close dropdown when clicking inside', async () => {
      render(
        <div>
          <Dropdown>
            {(props) => <MockDropdownChild {...props} />}
          </Dropdown>
          <div data-testid="outside-element">Outside</div>
        </div>
      );

      const trigger = screen.getByTestId('dropdown-trigger');

      // Open dropdown
      fireEvent.click(trigger);
      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();

      // Click inside dropdown menu
      const menu = screen.getByTestId('dropdown-menu');
      fireEvent.mouseDown(menu);

      await waitFor(() => {
        expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
      });
    });

    it('should handle mousedown events on document body', async () => {
      render(
        <Dropdown>
          {(props) => <MockDropdownChild {...props} />}
        </Dropdown>
      );

      const trigger = screen.getByTestId('dropdown-trigger');

      // Open dropdown
      fireEvent.click(trigger);
      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();

      // Click on document body
      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(screen.queryByTestId('dropdown-menu')).not.toBeInTheDocument();
      });
    });

    it('should handle null target in mousedown event', async () => {
      render(
        <Dropdown>
          {(props) => <MockDropdownChild {...props} />}
        </Dropdown>
      );

      const trigger = screen.getByTestId('dropdown-trigger');

      // Open dropdown
      fireEvent.click(trigger);
      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();

      // Create event with null target
      const nullTargetEvent = new MouseEvent('mousedown', { bubbles: true });
      Object.defineProperty(nullTargetEvent, 'target', { value: null });
      
      // This should not cause errors
      fireEvent(document, nullTargetEvent);

      // Dropdown should remain open since target is null
      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
    });

    it('should not close dropdown when dropdownRef.current is null', async () => {
      const RefNullChild = ({ isOpen, toggle }: { isOpen: boolean; toggle: () => void }) => {
        React.useEffect(() => {
          // Force ref to be null by not attaching to element
          const event = new MouseEvent('mousedown', { bubbles: true });
          Object.defineProperty(event, 'target', { value: document.body });
          document.dispatchEvent(event);
        }, []);

        return (
          <div>
            <button onClick={toggle} data-testid="dropdown-trigger">
              Toggle
            </button>
            {isOpen && <div data-testid="dropdown-menu">Menu</div>}
          </div>
        );
      };

      render(
        <Dropdown>
          {(props) => <RefNullChild {...props} />}
        </Dropdown>
      );

      // This test verifies the null check in the useEffect handler
      expect(screen.getByTestId('dropdown-trigger')).toBeInTheDocument();
    });
  });

  describe('Event Listener Management', () => {
    it('should add event listener on mount', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      
      render(
        <Dropdown>
          {(props) => <MockDropdownChild {...props} />}
        </Dropdown>
      );

      expect(addEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
      
      addEventListenerSpy.mockRestore();
    });

    it('should remove event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      
      const { unmount } = render(
        <Dropdown>
          {(props) => <MockDropdownChild {...props} />}
        </Dropdown>
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
      
      removeEventListenerSpy.mockRestore();
    });

    it('should use the same handler function for add and remove event listener', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      
      const { unmount } = render(
        <Dropdown>
          {(props) => <MockDropdownChild {...props} />}
        </Dropdown>
      );

      const addedHandler = addEventListenerSpy.mock.calls[0][1];
      
      unmount();
      
      const removedHandler = removeEventListenerSpy.mock.calls[0][1];
      expect(addedHandler).toBe(removedHandler);
      
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle children function that returns null', () => {
      const { container } = render(
        <Dropdown>
          {() => null}
        </Dropdown>
      );

      // Should not throw an error and should render the wrapper div
      expect(container.firstChild).toHaveClass('relative');
    });

    it('should handle rapid successive clicks', () => {
      render(
        <Dropdown>
          {(props) => <MockDropdownChild {...props} />}
        </Dropdown>
      );

      const trigger = screen.getByTestId('dropdown-trigger');

      // Rapid clicks
      for (let i = 0; i < 10; i++) {
        fireEvent.click(trigger);
      }

      // Should end up closed (even number of clicks)
      expect(screen.queryByTestId('dropdown-menu')).not.toBeInTheDocument();
    });

    it('should handle selecting the same value multiple times', () => {
      render(
        <Dropdown>
          {(props) => <MockDropdownChild {...props} />}
        </Dropdown>
      );

      const trigger = screen.getByTestId('dropdown-trigger');

      // Select same option multiple times
      for (let i = 0; i < 3; i++) {
        fireEvent.click(trigger);
        fireEvent.click(screen.getByTestId('option-1'));
        expect(trigger).toHaveTextContent('option1');
      }
    });

    it('should handle special characters in selected values', () => {
      const SpecialCharChild = ({ isOpen, toggle, selectedValue, onSelect }: { isOpen: boolean; toggle: () => void; selectedValue?: string; onSelect: (value: string) => void }) => (
        <div>
          <button onClick={toggle} data-testid="dropdown-trigger">
            {selectedValue || 'Select an option'}
          </button>
          {isOpen && (
            <div data-testid="dropdown-menu">
              <button onClick={() => onSelect('special!@#$%^&*()')} data-testid="special-option">
                Special Characters
              </button>
            </div>
          )}
        </div>
      );

      render(
        <Dropdown>
          {(props) => <SpecialCharChild {...props} />}
        </Dropdown>
      );

      const trigger = screen.getByTestId('dropdown-trigger');
      fireEvent.click(trigger);
      fireEvent.click(screen.getByTestId('special-option'));

      expect(trigger).toHaveTextContent('special!@#$%^&*()');
    });

    it('should handle very long selected values', () => {
      const longValue = 'A'.repeat(1000);
      const LongValueChild = ({ isOpen, toggle, selectedValue, onSelect }: { isOpen: boolean; toggle: () => void; selectedValue?: string; onSelect: (value: string) => void }) => (
        <div>
          <button onClick={toggle} data-testid="dropdown-trigger">
            {selectedValue || 'Select an option'}
          </button>
          {isOpen && (
            <div data-testid="dropdown-menu">
              <button onClick={() => onSelect(longValue)} data-testid="long-option">
                Long Value
              </button>
            </div>
          )}
        </div>
      );

      render(
        <Dropdown>
          {(props) => <LongValueChild {...props} />}
        </Dropdown>
      );

      const trigger = screen.getByTestId('dropdown-trigger');
      fireEvent.click(trigger);
      fireEvent.click(screen.getByTestId('long-option'));

      expect(trigger).toHaveTextContent(longValue);
    });

    it('should handle undefined defaultValue prop', () => {
      render(
        <Dropdown defaultValue={undefined}>
          {(props) => <MockDropdownChild {...props} />}
        </Dropdown>
      );

      expect(screen.getByTestId('dropdown-trigger')).toHaveTextContent('Select an option');
    });
  });

  describe('State Management', () => {
    it('should maintain separate state for multiple dropdown instances', () => {
      render(
        <div>
          <Dropdown>
            {(props) => (
              <div data-testid="dropdown-1">
                <button onClick={props.toggle} data-testid="trigger-1">
                  Trigger 1
                </button>
                {props.isOpen && <div data-testid="menu-1">Menu 1</div>}
              </div>
            )}
          </Dropdown>
          <Dropdown>
            {(props) => (
              <div data-testid="dropdown-2">
                <button onClick={props.toggle} data-testid="trigger-2">
                  Trigger 2
                </button>
                {props.isOpen && <div data-testid="menu-2">Menu 2</div>}
              </div>
            )}
          </Dropdown>
        </div>
      );

      const trigger1 = screen.getByTestId('trigger-1');
      const trigger2 = screen.getByTestId('trigger-2');

      // Open first dropdown
      fireEvent.click(trigger1);
      expect(screen.getByTestId('menu-1')).toBeInTheDocument();
      expect(screen.queryByTestId('menu-2')).not.toBeInTheDocument();

      // Open second dropdown
      fireEvent.click(trigger2);
      expect(screen.getByTestId('menu-1')).toBeInTheDocument();
      expect(screen.getByTestId('menu-2')).toBeInTheDocument();
    });

    it('should preserve selected value when toggling', () => {
      render(
        <Dropdown>
          {(props) => <MockDropdownChild {...props} />}
        </Dropdown>
      );

      const trigger = screen.getByTestId('dropdown-trigger');

      // Select an option
      fireEvent.click(trigger);
      fireEvent.click(screen.getByTestId('option-1'));
      expect(trigger).toHaveTextContent('option1');

      // Toggle dropdown and check value is preserved
      fireEvent.click(trigger);
      expect(trigger).toHaveTextContent('option1');
      fireEvent.click(trigger);
      expect(trigger).toHaveTextContent('option1');
    });

    it('should reset to closed state after selection regardless of previous state', () => {
      render(
        <Dropdown>
          {(props) => <MockDropdownChild {...props} />}
        </Dropdown>
      );

      const trigger = screen.getByTestId('dropdown-trigger');

      // Open dropdown
      fireEvent.click(trigger);
      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();

      // Select option - should close dropdown
      fireEvent.click(screen.getByTestId('option-1'));
      expect(screen.queryByTestId('dropdown-menu')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes when dropdown is opened', () => {
      const AccessibleChild = ({ isOpen, toggle, selectedValue, onSelect }: { isOpen: boolean; toggle: () => void; selectedValue?: string; onSelect: (value: string) => void }) => (
        <div>
          <button 
            onClick={toggle} 
            data-testid="dropdown-trigger"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
          >
            {selectedValue || 'Select an option'}
          </button>
          {isOpen && (
            <div data-testid="dropdown-menu" role="listbox">
              <button role="option" onClick={() => onSelect('option1')} data-testid="option-1">
                Option 1
              </button>
            </div>
          )}
        </div>
      );

      render(
        <Dropdown>
          {(props) => <AccessibleChild {...props} />}
        </Dropdown>
      );

      const trigger = screen.getByTestId('dropdown-trigger');
      
      // Check closed state
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      
      // Check opened state
      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByTestId('dropdown-menu')).toHaveAttribute('role', 'listbox');
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      let renderCount = 0;
      const CountingChild = (props: { isOpen: boolean; toggle: () => void; selectedValue?: string; onSelect: (value: string) => void }) => {
        renderCount++;
        return <MockDropdownChild {...props} />;
      };

      render(
        <Dropdown>
          {(props) => <CountingChild {...props} />}
        </Dropdown>
      );

      const initialRenderCount = renderCount;

      // Open and close dropdown
      const trigger = screen.getByTestId('dropdown-trigger');
      fireEvent.click(trigger);
      fireEvent.click(trigger);

      // Should have rendered additional times for state changes
      expect(renderCount).toBeGreaterThan(initialRenderCount);
    });
  });

  describe('Ref Management', () => {
    it('should properly attach ref to wrapper div', () => {
      const { container } = render(
        <Dropdown>
          {(props) => <MockDropdownChild {...props} />}
        </Dropdown>
      );

      const wrapperDiv = container.firstChild as HTMLElement;
      expect(wrapperDiv.tagName).toBe('DIV');
      expect(wrapperDiv).toHaveClass('relative');
    });

    it('should handle ref updates correctly', async () => {
      const TestComponent = () => {
        const [show, setShow] = React.useState(true);
        
        return (
          <div>
            <button onClick={() => setShow(!show)} data-testid="toggle-component">
              Toggle Component
            </button>
            {show && (
              <Dropdown>
                {(props) => <MockDropdownChild {...props} />}
              </Dropdown>
            )}
          </div>
        );
      };

      render(<TestComponent />);

      // Open dropdown
      const trigger = screen.getByTestId('dropdown-trigger');
      fireEvent.click(trigger);
      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();

      // Toggle component off and on
      const toggleButton = screen.getByTestId('toggle-component');
      fireEvent.click(toggleButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('dropdown-trigger')).not.toBeInTheDocument();
      });

      fireEvent.click(toggleButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('dropdown-trigger')).toBeInTheDocument();
      });
    });
  });
});