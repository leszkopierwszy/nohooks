<template>
    <!-- px-4 sm:px-6 lg:px-8 -->
    <div class="">
      <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
          <h1 class="text-base font-semibold text-gray-900">All jobs</h1>
          <p class="mt-2 text-sm text-gray-700">A list of all your persona jobs and their statistics</p>
        </div>
        <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button type="button" class="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Add user</button>
        </div>
      </div>
      <div class="mt-8 flow-root">
        <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table class="relative min-w-full">
              <thead class="bg-white">
                <tr>
                  <!-- <th scope="col" class="py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-3">Name</th> -->
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Title</th>
                  <!-- <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Years</th> -->
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Role</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Years</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">MS Gross</th>
                  <th scope="col" class="py-3.5 pr-4 pl-3 sm:pr-3">
                    <span class="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white">
                <template v-for="location in locations" :key="location.name">
                  <tr class="border-t border-gray-200">
                    <th colspan="5" scope="colgroup" class="bg-gray-50 py-2 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-3">{{ location.name }}</th>
                  </tr>
                  <tr v-for="(person, personIdx) in location.people" :key="person.email" :class="[personIdx === 0 ? 'border-gray-300' : 'border-gray-200', 'border-t']">
                    <!-- <td class="py-4 pr-3 pl-4 text-sm font-medium whitespace-nowrap text-gray-900 sm:pl-3">{{ person.name }}</td> -->
                    <td class="px-3 py-4 text-sm whitespace-nowrap text-gray-500">{{ person.title }}</td>
                    <td class="px-3 py-4 text-sm whitespace-nowrap text-gray-500">{{ person.role }}</td>
                    <td class="px-3 py-4 text-sm whitespace-nowrap text-gray-500">{{ person.years }}</td>
                    <td class="py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-3">
                      <a href="#" class="text-indigo-600 hover:text-indigo-900"
                        >Edit<span class="sr-only">, {{ person.name }}</span></a
                      >
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  const locations = [
    {
      name: 'Novo Nordisk',
      people: [
        { title: 'IT Operations Analyst', email: 'lindsay.walton@example.com', years: '', role: 'Support, Operations' },
        { title: 'IT Support Analyst', email: 'courtney.henry@example.com', years: '',role: 'Support' },
        { title: 'IT Supporter', email: 'courtney.henry@example.com', years: '',role: 'Support' },
      ],
    },
    {
      name: 'Johnson and Johnson',
      people: [
        { title: '2nd Level on-site IT Support', email: 'tom.cook@example.com', role: 'Member' },
      ],
    },
    {
      name: 'Imperium Szkoleniowe',
      people: [
        { title: 'VP, User Experience', email: 'emily.selman@example.com', role: 'Member' },
        { title: 'VP, Human Resources', email: 'kristin.watson@example.com', role: 'Admin' },
        { title: 'Senior Developer', email: 'emma.dorsey@example.com', role: 'Member' },
      ],
    },
    {
      name: 'Imperium Szkoleniowe',
      people: [
        { title: 'VP, User Experience', email: 'emily.selman@example.com', role: 'Member' },
        { title: 'VP, Human Resources', email: 'kristin.watson@example.com', role: 'Admin' },
        { title: 'Senior Developer', email: 'emma.dorsey@example.com', role: 'Member' },
      ],
    },
  ]
  </script>