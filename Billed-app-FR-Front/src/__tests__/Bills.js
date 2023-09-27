/**
 * @jest-environment jsdom
 */

import {prettyDOM, screen, waitFor, fireEvent} from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import BillsUI from "../views/BillsUI.js"

import mockStore from "../__mocks__/store"

import { ROUTES_PATH, ROUTES } from "../constants/routes"
import { localStorageMock } from "../__mocks__/localStorage.js"

import { bills } from "../fixtures/bills"
import router from "../app/Router"
import Bills from "../containers/Bills.js"

jest.mock("../app/store", () => mockStore) // ?

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon).toBeTruthy();

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      //Cette fonction de tri soustrait l'élément b de l'élément a. Si le résultat de cette soustraction est positif, cela signifie que b est plus grand que a, et donc, a devrait être placé avant b dans le tableau trié. Cela a pour effet de trier le tableau dans un ordre décroissant.
      const antiChrono = (a, b) => (b - a)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })

})

describe("When I click on the eye icon", () => {
  test("Then modal with supporting documents appears", async () => {
    $.fn.modal = jest.fn() // Suppression de l'erreur jQuery

    // Fonction de navigation fictive
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname })
    }

    // Création d'un affichage factice des notes de frais
    document.body.innerHTML = BillsUI({ data: bills })

    // Initialisation de la classe Bills
    const bill = new Bills({ document, onNavigate, localStorage: window.localStorage });

    // Fonction de gestion du clic sur l'icône "eye"
    const handleClickIconEye = jest.fn((icon) => bill.handleClickIconEye(icon));
    const iconEye = screen.getAllByTestId("icon-eye")[0];
    iconEye.addEventListener("click", handleClickIconEye(iconEye));
    fireEvent.click(iconEye);

    // Assertions
    expect(handleClickIconEye).toHaveBeenCalled()
    expect(screen.getByText("Justificatif")).toBeTruthy();
    expect(screen.getByAltText("Bill")).toBeTruthy();
  })
})

describe("When I click on \"Nouvelle note de frais\"", () => {
  test("Then the invoice creation form appears", async () => {
    // Fonction de navigation fictive
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname })
    }

    // Création d'un affichage factice des notes de frais triées par date décroissante
    document.body.innerHTML = BillsUI({ data: bills.sort((a, b) => new Date(b.date) - new Date(a.date)) })

    // Initialisation de la classe Bills
    const bill = new Bills({ document, onNavigate, localStorage: window.localStorage });
    const handleClickNewBill = jest.fn(() => bill.handleClickNewBill());

    // Gestion du clic sur le bouton "Nouvelle note de frais"
    const btnNewBill = screen.getByTestId("btn-new-bill");
    btnNewBill.addEventListener("click", handleClickNewBill);
    fireEvent.click(btnNewBill);

    // Assertions
    expect(handleClickNewBill).toHaveBeenCalled();
    expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
    expect(screen.getByTestId("form-new-bill")).toBeTruthy();
  })
})

