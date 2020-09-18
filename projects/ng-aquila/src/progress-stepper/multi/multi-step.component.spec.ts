import { Component, ElementRef, Type, ViewChild, Directive } from '@angular/core';
import { async, ComponentFixture, fakeAsync, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { NxProgressStepperModule } from '../progress-stepper.module';
import { NxMultiStepperComponent, NxMultiStepperDirection } from './multi-step.component';

import * as axe from 'axe-core';
import { Validators, FormBuilder, ReactiveFormsModule, FormsModule, FormGroup, FormControl } from '@angular/forms';
import { NxInputModule } from '@aposin/ng-aquila/input';
import { NxFormfieldModule } from '@aposin/ng-aquila/formfield';

// We can safely ignore some conventions in our specs
// tslint:disable:component-class-suffix

@Directive()
abstract class MultiStepTest {
  @ViewChild(NxMultiStepperComponent) componentInstance: NxMultiStepperComponent;
  @ViewChild(NxMultiStepperComponent,  { read: ElementRef }) componentInstanceRef: ElementRef;
}

describe('NxMultiStepperComponent', () => {
  let fixture: ComponentFixture<MultiStepTest>;
  let testInstance: MultiStepTest;
  let multiStepElementRef: ElementRef;
  let multiStepInstance: NxMultiStepperComponent;

  function getSteps(): HTMLElement[] {
    return Array.from(multiStepElementRef.nativeElement.querySelectorAll('nx-multi-step-item'));
  }

  function createTestComponent(component: Type<MultiStepTest>) {
    fixture = TestBed.createComponent(component);
    fixture.detectChanges();
    testInstance = fixture.componentInstance;
    multiStepInstance = testInstance.componentInstance;
    multiStepElementRef = testInstance.componentInstanceRef;
  }

  beforeEach(
    async(() => {
      TestBed.configureTestingModule({
        declarations: [
          MultiStepBasicTest,
          LinearStepBasicTest,
          MultiStepCompletionTest,
          MultiStepValidationTest,
          MultiStepDirectionTest,
          MultiStepGroupTest
        ],
        imports: [
          NxProgressStepperModule,
          NxInputModule,
          NxFormfieldModule,
          FormsModule,
          ReactiveFormsModule
        ],
      }).compileComponents();
    })
  );

  it( 'should create the component', fakeAsync(() => {
      createTestComponent(MultiStepBasicTest);
      expect(multiStepInstance).toBeTruthy();
  }));

  it('should show checked icon on completed item', () => {
      createTestComponent(MultiStepBasicTest);

      let checkIcon = fixture.debugElement.queryAll(By.css('nx-icon'));
      expect(checkIcon.length).toBe(0);

      multiStepInstance.next();
      fixture.detectChanges();

      checkIcon = fixture.debugElement.queryAll(By.css('nx-icon'));
      expect(checkIcon.length).toBe(1);
  });

  it('sets correctly selected class on the currently selected step', () => {
    createTestComponent(MultiStepCompletionTest);
    const completionStepper: MultiStepCompletionTest = fixture.componentInstance as MultiStepCompletionTest;

    let activeDot = fixture.nativeElement.querySelector('nx-multi-step-item .small-dot');
    expect(activeDot).not.toBeNull();

    completionStepper.completedOne = true;
    fixture.detectChanges();

    const firstElement = fixture.nativeElement.querySelectorAll('nx-multi-step-item')[0];
    activeDot = firstElement.querySelector('.small-dot');
    expect(activeDot).toBeNull();
  });

  it('updates the template on manual step completion via input binding', () => {
    createTestComponent(MultiStepCompletionTest);

    const completionStepper: MultiStepCompletionTest = fixture.componentInstance as MultiStepCompletionTest;

    let checkIcon = fixture.debugElement.queryAll(By.css('nx-icon'));
    expect(checkIcon.length).toBe(0);

    completionStepper.completedTwo = true;
    fixture.detectChanges();

    checkIcon = fixture.debugElement.queryAll(By.css('nx-icon'));
    expect(checkIcon.length).toBe(1);
  });

  describe('on step click', () => {

    it('jumps to the correct step', () => {
      createTestComponent(MultiStepBasicTest);
      let stepToClick = fixture.nativeElement.querySelectorAll('nx-multi-step-item')[1];
      stepToClick.click();
      fixture.detectChanges();
      expect(multiStepInstance.selected.label).toBe('Step 2');

      stepToClick = fixture.nativeElement.querySelectorAll('nx-multi-step-item')[0];
      stepToClick.click();
      fixture.detectChanges();
      expect(multiStepInstance.selected.label).toBe('Step 1');
    });

  });

  describe('linear', () => {
    beforeEach(() => {
      createTestComponent(LinearStepBasicTest);
    });

    it('has disabled steps', () => {
      const steps = getSteps();
      expect(steps[0].getAttribute('aria-disabled')).toBe(null);
      expect(steps[1].getAttribute('aria-disabled')).toBe('true');
    });

    it('does not jump to a particular step when clicked', () => {
      const stepToClick = getSteps()[1];
      stepToClick.click();
      fixture.detectChanges();
      expect(multiStepInstance.selected.label).toBe('Step1');
    });
  });

  describe('error validation', () => {
    it('shows errors on required fields on jump to a particular step if LINEAR', () => {
      createTestComponent(LinearStepBasicTest);
      multiStepInstance.next();
      fixture.detectChanges();

      expect(multiStepInstance.currentStep.label).toBe('Step1');
      const formField = fixture.nativeElement.querySelector('nx-formfield');
      expect(formField.classList.contains('has-error')).toBe(true);
    });

    it('shows errors if a form is untouched on next() call', () => {
      createTestComponent(MultiStepValidationTest);

      multiStepInstance.next();
      fixture.detectChanges();

      const formField = fixture.nativeElement.querySelector('nx-formfield');
      expect(formField.classList.contains('has-error')).toBe(true);
    });

    it('shows errors if a form is untouched on selectedIndex change', () => {
      createTestComponent(MultiStepValidationTest);

      multiStepInstance.selectedIndex = 1;
      fixture.detectChanges();

      const formField = fixture.nativeElement.querySelector('nx-formfield');
      expect(formField.classList.contains('has-error')).toBe(true);
    });
  });

  describe('direction', () => {
    it('has horizontal direction by default', () => {
      createTestComponent(MultiStepBasicTest);
      expect(multiStepInstance.direction).toBe('horizontal');
    });

    describe('when changing the direction to vertical', () => {
      beforeEach(() => {
        createTestComponent(MultiStepDirectionTest);
        (fixture.componentInstance as MultiStepDirectionTest).direction = 'vertical';
        fixture.detectChanges();
      });

      it('has vertical direction', () => {
        expect(multiStepInstance.direction).toBe('vertical');
        expect(multiStepElementRef.nativeElement.classList.contains('nx-multi-stepper--vertical')).toBe(true);
        const steps: HTMLElement[] = Array.from(multiStepElementRef.nativeElement.querySelectorAll('nx-multi-step'));
        steps.forEach(step => {
          expect(step.classList.contains('nx-multi-step--vertical')).toBe(true);
        });
      });
    });
  });

  describe('groups', () => {
    beforeEach(() => {
      createTestComponent(MultiStepGroupTest);
    });

    it('renders the groups', () => {
      const groups = Array.from( multiStepElementRef.nativeElement.querySelectorAll('.nx-multi-stepper__group'));

      expect(groups.length).toBe(2);

      groups.forEach((group: HTMLElement, i) => {
        const label = group.querySelector('.nx-multi-stepper__group-label');
        expect(label.textContent.trim()).toBe(`Group ${i + 1}`);
      });
    });

    it('renders the steps', () => {
      const steps = Array.from( multiStepElementRef.nativeElement.querySelectorAll('nx-multi-step-item'));

      steps.forEach((step: HTMLElement) => {
        expect(step.classList.contains('.nx-multi-step-item--vertical'));
      });
    });

    describe('on step click', () => {
      it('jumps to the correct step', () => {
        createTestComponent(MultiStepGroupTest);
        let stepToClick = fixture.nativeElement.querySelectorAll('nx-multi-step-item')[1];
        stepToClick.click();
        fixture.detectChanges();
        expect(multiStepInstance.selected.label).toBe('Step 2');

        stepToClick = fixture.nativeElement.querySelectorAll('nx-multi-step-item')[0];
        stepToClick.click();
        fixture.detectChanges();
        expect(multiStepInstance.selected.label).toBe('Step 1');
      });
    });

    describe('active state', () => {
      beforeEach(() => {
        createTestComponent(MultiStepGroupTest);
      });

      it('first step does not have active state', () => {
        const step = fixture.nativeElement.querySelector('nx-multi-step-item');
        expect(step.classList.contains('is-active')).toBe(false);
      });

      it('first step has active state', () => {
        multiStepInstance.selectedIndex = 1;
        fixture.detectChanges();

        const step = fixture.nativeElement.querySelector('nx-multi-step-item');
        expect(step.classList.contains('is-active')).toBe(true);
      });
    });

    describe('completed state', () => {
      beforeEach(() => {
        createTestComponent(MultiStepGroupTest);
      });

      it('is not completed', () => {
        const step = fixture.nativeElement.querySelector('nx-multi-step-item');
        expect(step.classList.contains('is-completed')).toBe(false);
      });

      it('is completed', () => {
        (testInstance as MultiStepGroupTest).completedOne = true;
        fixture.detectChanges();

        const step = fixture.nativeElement.querySelector('nx-multi-step-item');
        expect(step.classList.contains('is-completed')).toBe(true);
      });
    });
  });

  describe('programmatic', () => {
    beforeEach(() => {
      createTestComponent(MultiStepBasicTest);
    });

    it('has vertical direction', () => {
      multiStepInstance.direction = 'vertical';
      fixture.detectChanges();
      expect(multiStepElementRef.nativeElement.classList.contains('nx-multi-stepper--vertical')).toBe(true);
    });
  });

  describe('a11y', () => {

    it('has no accessibility violations for basic use case', function (done) {
      createTestComponent(MultiStepBasicTest);

      axe.run(fixture.nativeElement, {}, (error: Error, results: axe.AxeResults) => {
        expect(results.violations.length).toBe(0);
        done();
      });
    });
  });
});

@Component({
  template: `
    <nx-multi-stepper [direction]="direction">
      <nx-step label='Step 1'>
        step 1 content
      </nx-step>
      <nx-step label='Step 2'>
        step 2 content
      </nx-step>
    </nx-multi-stepper>
  `
})
class MultiStepDirectionTest extends MultiStepTest {
  direction: NxMultiStepperDirection;
}

@Component({
  template: `
  <nx-multi-stepper [linear]='true' currentStepLabel='Step'>
  <nx-step label='Step1' [stepControl]="manualCompletionForm">
    <form [formGroup]='manualCompletionForm'>
      <nx-formfield nxLabel='Name'>
        <input nxInput required formControlName='form1'>
      </nx-formfield>
    </form>
  </nx-step>
  <nx-step label='Step2'></nx-step>
  </nx-multi-stepper>
  `
})
class LinearStepBasicTest extends MultiStepTest {
  _formBuilder: FormBuilder = new FormBuilder();
  manualCompletionForm = this._formBuilder.group( {'form1': ['', Validators.required]});
 }

@Component({
  template: `
    <nx-multi-stepper>
      <nx-step label='Step 1' [completed]="completedOne">
        step 1 content
      </nx-step>
      <nx-step label='Step 2' [completed]="completedTwo">
        step 2 content
      </nx-step>
    </nx-multi-stepper>
  `
})
class MultiStepCompletionTest extends MultiStepTest {
  completedOne = false;
  completedTwo = false;
}

@Component({
  template: `
  <nx-multi-stepper [linear]="true">
  <nx-step label="Your name" [stepControl]="manualCompletionForm">
    <form [formGroup]="manualCompletionForm">
      <nx-formfield nxLabel="Name">
        <input nxInput formControlName="name" required>
      </nx-formfield>
      <button type="button" nxStepperNext>Next</button>
    </form>
  </nx-step>
  <nx-step label="Done">
  asdf
  </nx-step>
  </nx-multi-stepper>
  `
})
class MultiStepValidationTest extends MultiStepTest {
  manualCompletionForm = new FormGroup({
    name: new FormControl('', Validators.required)
  });
}

@Component({
  template: `
    <nx-multi-stepper>
      <nx-step label='Step 1'>
        step 1 content
      </nx-step>
      <nx-step label='Step 2'>
        step 2 content
      </nx-step>
    </nx-multi-stepper>
  `
})
class MultiStepBasicTest extends MultiStepTest { }

@Component({
  template: `
    <nx-multi-stepper direction="vertical">
      <nx-step-group label="Group 1">
        <nx-step label='Step 1' [completed]="completedOne">
          step 1 content
        </nx-step>
      </nx-step-group>
      <nx-step-group label="Group 2">
        <nx-step label='Step 2'>
          step 2 content
        </nx-step>
      </nx-step-group>
    </nx-multi-stepper>
  `
})
class MultiStepGroupTest extends MultiStepTest {
  completedOne: boolean = false;
}