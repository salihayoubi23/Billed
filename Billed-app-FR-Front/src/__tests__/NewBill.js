/**
 * @jest-environment jsdom
 */

import { fireEvent, prettyDOM, screen, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import BillsUI from "../views/BillsUI.js";
import NewBill from "../containers/NewBill.js";
import mockStore from "../__mocks__/store";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage.js";
import userEvent from "@testing-library/user-event";
import router from "../app/Router.js";
import Store from "../app/Store";

jest.mock('../app/store', () => mockStore)
// Importation des dépendances et configuration initiale des tests
describe('Given I am connected as an employee', () => {
  // Début des tests pour la page NewBill
  describe('When I am on the NewBill Page and click on the "change file" button', () => {
      beforeEach(() => {
          // Configuration initiale des tests : définir localStorage, location, et le contenu HTML du document
          Object.defineProperty(window, 'localStorage', { value: localStorageMock });
          Object.defineProperty(window, 'location', { value: { hash: ROUTES_PATH['NewBill'] } });

          // Configuration du type d'utilisateur en tant qu'employé et initialisation du contenu HTML
          window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }));
          document.body.innerHTML = `<div id="root"></div>`;
          // Configuration de la navigation
          router();
      });

      // Test : Choix d'un fichier avec une extension valide
      test('Then I can choose a file with a valid extension', async () => {
          // Création d'une instance de NewBill et configuration d'un gestionnaire d'événements pour le changement de fichier
          const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });
          const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
          const inputFile = screen.getByTestId("file");

          // Création d'un fichier simulé avec une extension valide
          const file = new File(["contenu du fichier fake"], "facture.png", { type: "image/png" });

          // Ajout du gestionnaire d'événements pour le changement de fichier et simulation du changement de fichier
          inputFile.addEventListener("change", handleChangeFile);
          fireEvent.change(inputFile, { target: { files: [file] } });

          // Vérification que le gestionnaire d'événements a été appelé et que le fichier a été correctement sélectionné
          expect(handleChangeFile).toBeCalled();
          expect(inputFile.files.length).toBe(1);
          expect(inputFile.files[0].name).toBe("facture.png");
      });

      // Test : Choix d'un fichier avec une extension non valide
      test('Then I can choose a file with an invalid extension', async () => {
          // Création d'une instance de NewBill et configuration d'un gestionnaire d'événements pour le changement de fichier
          const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });
          const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
          const inputFile = screen.getByTestId("file");

          // Création d'un fichier simulé avec une extension non valide (PDF au lieu de PNG)
          const file = new File(["contenu du fichier fake"], "facture.pdf", { type: "application/pdf" });

          // Ajout du gestionnaire d'événements pour le changement de fichier et simulation du changement de fichier
          inputFile.addEventListener("change", handleChangeFile);
          fireEvent.change(inputFile, { target: { files: [file] } });

          // Vérification que le gestionnaire d'événements a été appelé et que le champ de fichier est vide
          expect(handleChangeFile).toBeCalled();
          expect(inputFile.value).toBeFalsy();
      });
  });

  // Suite de tests : Remplissage du formulaire avec des données valides et soumission
  describe('When I fill in the fields with the correct format and click the submit button', () => {
      test('Then I should post a new Bill ticket', async () => {
          // Configuration initiale des tests
          const onNavigate = (pathname) => {
              document.body.innerHTML = ROUTES({ pathname });
          };

          // Création d'une instance de NewBill et configuration des valeurs d'entrée
          const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });
          const inputData = {
              type: 'Transports',
              name:  'Billet de train Paris - Marseille',
              amount: '250',
              date:  '2023-04-25',
              vat: 80,
              pct: 25,
              file: new File(['billet de train'], 'billet.png', { type:'image/png' }),
              commentary: 'Note de deplacement professionnel',
              status: 'pending'
          };

          // Récupération des éléments du formulaire
          const inputType = screen.getByTestId('expense-type');
          const inputName = screen.getByTestId('expense-name');
          const inputDate = screen.getByTestId('datepicker');
          const inputAmount = screen.getByTestId('amount');
          const inputVat = screen.getByTestId('vat');
          const inputPct = screen.getByTestId('pct');
          const inputComment = screen.getByTestId('commentary');
          const inputFile = screen.getByTestId('file');
          const form = screen.getByTestId('form-new-bill');

          // Remplissage des champs de formulaire avec des données valides
          fireEvent.change(inputType, { target: { value: inputData.type } });
          fireEvent.change(inputName, { target: { value: inputData.name } });
          fireEvent.change(inputDate, { target: { value: inputData.date } });
          fireEvent.change(inputAmount, { target: { value: inputData.amount } });
          fireEvent.change(inputVat, { target: { value: inputData.vat } });
          fireEvent.change(inputPct, { target: { value: inputData.pct } });
          fireEvent.change(inputComment, { target: { value: inputData.commentary } });

          // Configuration des gestionnaires d'événements pour le changement de fichier et la soumission du formulaire
          const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
          const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
          inputFile.addEventListener("change", handleChangeFile);
          form.addEventListener('submit', handleSubmit);

          // Simulation de l'envoi du fichier et de la soumission du formulaire
          userEvent.upload(inputFile, inputData.file);
          fireEvent.submit(form);

          // Vérification que le gestionnaire de soumission a été appelé et que les champs de formulaire sont valides
          expect(handleSubmit).toHaveBeenCalled();
          expect(inputType.validity.valid).toBeTruthy();
          expect(inputName.validity.valid).toBeTruthy();
          expect(inputDate.validity.valid).toBeTruthy();
          expect(inputAmount.validity.valid).toBeTruthy();
          expect(inputVat.validity.valid).toBeTruthy();
          expect(inputPct.validity.valid).toBeTruthy();
          expect(inputComment.validity.valid).toBeTruthy();
          expect(inputFile.files[0]).toBeDefined();
      });

      // Test : Rendu de la page des factures après la soumission réussie du formulaire
      test('Then it should render the Bills Page', () => {
          // Vérification que la page des factures est correctement rendue après la soumission du formulaire
          expect(screen.getAllByText('Mes notes de frais')).toBeTruthy();
      });
  });

  // Suite de tests : Remplissage du formulaire avec des données incorrectes et soumission
  describe('When I fill in the fields with incorrect format and click the submit button', () => {
      test('Then I should have an HTML validation error in the form', async () => {
          // Configuration initiale des tests
          Object.defineProperty(window, 'localStorage', { value: localStorageMock });
          Object.defineProperty(window, 'location', { value: { hash: ROUTES_PATH['NewBill'] } });

          // Configuration du type d'utilisateur en tant qu'employé et initialisation du contenu HTML
          window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }));
          document.body.innerHTML = `<div id="root"></div>`;
          // Configuration de la navigation
          router();

          // Configuration du gestionnaire de navigation
          const onNavigate = (pathname) => {
              document.body.innerHTML = ROUTES({ pathname });
          };

          // Création d'une instance de NewBill et configuration des valeurs d'entrée avec des données incorrectes
          const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });
          const inputData = {
              type: 'test',
              name:  'Vol Paris - Berlin',
              amount: 'test',
              date:  'date incorrecte',
              vat: 70,
              pct: 'test',
              file: new File(['img'], 'image.png', { type: 'image/png' }),
              commentary: 'Note de deplacement professionnel',
              status: 'pending'
          };

          // Récupération des éléments du formulaire
          const inputType = screen.getByTestId('expense-type');
          const inputName = screen.getByTestId('expense-name');
          const inputDate = screen.getByTestId('datepicker');
          const inputAmount = screen.getByTestId('amount');
          const inputVat = screen.getByTestId('vat');
          const inputPct = screen.getByTestId('pct');
          const inputComment = screen.getByTestId('commentary');
          const inputFile = screen.getByTestId('file');
          const form = screen.getByTestId('form-new-bill');

          // Remplissage des champs de formulaire avec des données incorrectes
          fireEvent.change(inputType, { target: { value: inputData.type } });
          fireEvent.change(inputName, { target: { value: inputData.name } });
          fireEvent.change(inputDate, { target: { value: inputData.date } });
          fireEvent.change(inputAmount, { target: { value: inputData.amount } });
          fireEvent.change(inputVat, { target: { value: inputData.vat } });
          fireEvent.change(inputPct, { target: { value: inputData.pct } });
          fireEvent.change(inputComment, { target: { value: inputData.commentary } });

          // Simulation de l'envoi du fichier
          userEvent.upload(inputFile, inputData.file);

          // Configuration du gestionnaire d'événements pour la soumission du formulaire
          const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
          form.addEventListener('submit', handleSubmit);

          // Simulation de la soumission du formulaire
          fireEvent.submit(form);

          // Vérification que le gestionnaire de soumission a été appelé et que les champs de formulaire sont invalides
          expect(handleSubmit).toHaveBeenCalled();
          expect(inputType.validity.valid).not.toBeTruthy();
          expect(inputDate.validity.valid).not.toBeTruthy();
          expect(inputAmount.validity.valid).not.toBeTruthy();
          expect(inputPct.validity.valid).not.toBeTruthy();
      });
  });
});
